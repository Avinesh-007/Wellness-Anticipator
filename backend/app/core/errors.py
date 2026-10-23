from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException


class AppException(Exception):
    """Base application exception."""
    def __init__(
        self,
        message: str,
        error_code: str = "APPLICATION_ERROR",
        status_code: int = status.HTTP_400_BAD_REQUEST,
        details: Optional[List[Dict[str, Any]]] = None
    ):
        self.message = message
        self.error_code = error_code
        self.status_code = status_code
        self.details = details or []
        super().__init__(message)


class ConsentRequiredException(AppException):
    """Raised when an operation requires ungranted or revoked user consent."""
    def __init__(self, consent_domain: str):
        super().__init__(
            message=f"Operation requires explicit active consent for domain '{consent_domain}'.",
            error_code="CONSENT_REQUIRED_OR_REVOKED",
            status_code=status.HTTP_403_FORBIDDEN,
            details=[{"consent_domain": consent_domain, "issue": "Consent not granted or withdrawn."}]
        )


class ResourceNotFoundException(AppException):
    """Raised when a requested resource does not exist or does not belong to the user."""
    def __init__(self, resource_name: str, resource_id: Any):
        super().__init__(
            message=f"{resource_name} with ID '{resource_id}' was not found.",
            error_code="RESOURCE_NOT_FOUND",
            status_code=status.HTTP_404_NOT_FOUND
        )


def build_error_response(
    request: Request,
    status_code: int,
    error_code: str,
    message: str,
    details: Optional[List[Dict[str, Any]]] = None
) -> JSONResponse:
    """Builds a standardized error envelope according to RFC 7807 principles."""
    return JSONResponse(
        status_code=status_code,
        content={
            "error_code": error_code,
            "message": message,
            "details": details or [],
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "path": request.url.path
        }
    )


async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    return build_error_response(
        request=request,
        status_code=exc.status_code,
        error_code=exc.error_code,
        message=exc.message,
        details=exc.details
    )


async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    error_code = "HTTP_ERROR"
    if exc.status_code == status.HTTP_401_UNAUTHORIZED:
        error_code = "AUTHENTICATION_FAILED"
    elif exc.status_code == status.HTTP_403_FORBIDDEN:
        error_code = "ACCESS_FORBIDDEN"
    elif exc.status_code == status.HTTP_404_NOT_FOUND:
        error_code = "NOT_FOUND"

    return build_error_response(
        request=request,
        status_code=exc.status_code,
        error_code=error_code,
        message=str(exc.detail)
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    details = []
    for err in exc.errors():
        loc = " -> ".join(str(l) for l in err.get("loc", []))
        details.append({
            "field": loc,
            "issue": err.get("msg", "Invalid value"),
            "type": err.get("type", "value_error")
        })

    return build_error_response(
        request=request,
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        error_code="VALIDATION_FAILED",
        message="Request payload failed schema validation.",
        details=details
    )
