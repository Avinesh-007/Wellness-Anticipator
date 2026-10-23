from fastapi import APIRouter
from app.api.v1.endpoints import (
    health,
    auth,
    consent,
    users,
    measurements,
    activities,
    sleep,
    export
)

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(consent.router, prefix="/consent", tags=["Consent"])
api_router.include_router(users.router, prefix="/users", tags=["Users & Profile"])
api_router.include_router(measurements.router, prefix="/measurements", tags=["Clinical Measurements"])
api_router.include_router(activities.router, prefix="/activities", tags=["Physical Activity"])
api_router.include_router(sleep.router, prefix="/sleep", tags=["Sleep Records"])
api_router.include_router(export.router, prefix="/export", tags=["Data Portability & Deletion"])
