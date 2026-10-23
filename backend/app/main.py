from contextlib import asynccontextmanager
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.core.database import init_db
from app.core.logging import setup_logging
from app.core.errors import (
    AppException,
    app_exception_handler,
    http_exception_handler,
    validation_exception_handler
)
from app.api.v1.router import api_router
from app.api.v1.endpoints.health import router as health_router

# Setup structured and sanitized logging
logger = setup_logging(settings.LOG_LEVEL)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management for initialization and clean teardown."""
    logger.info("Initializing Wellness Anticipator backend services...")
    # Ensure database schema is initialized on startup
    init_db()
    logger.info("Database schema verified.")
    yield
    logger.info("Shutting down Wellness Anticipator backend services...")


def create_application() -> FastAPI:
    """Factory function for creating the FastAPI modular monolith application."""
    app = FastAPI(
        title=settings.PROJECT_NAME,
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        docs_url=f"{settings.API_V1_STR}/docs",
        redoc_url=f"{settings.API_V1_STR}/redoc",
        lifespan=lifespan,
        debug=settings.DEBUG
    )

    # CORS Middleware
    if settings.BACKEND_CORS_ORIGINS:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    # Standardized Exception Handlers
    app.add_exception_handler(AppException, app_exception_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)

    # Mount Root-Level /health Endpoint
    app.include_router(health_router, prefix="", tags=["Health"])

    # Mount Versioned API Routes (/api/v1)
    app.include_router(api_router, prefix=settings.API_V1_STR)

    return app


app = create_application()
