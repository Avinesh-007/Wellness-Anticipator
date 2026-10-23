from fastapi import APIRouter
from app.api.v1.endpoints import (
    health,
    auth,
    consent,
    users,
    measurements,
    activities,
    sleep,
    export,
    assessments,
    trends,
    recommendations,
    habits,
    plans,
    wellbeing,
)

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(consent.router, prefix="/consent", tags=["Consent"])
api_router.include_router(users.router, prefix="/users", tags=["Users & Profile"])
api_router.include_router(measurements.router, prefix="/measurements", tags=["Clinical Measurements"])
api_router.include_router(activities.router, prefix="/activities", tags=["Physical Activity"])
api_router.include_router(sleep.router, prefix="/sleep", tags=["Sleep Records"])
api_router.include_router(assessments.router, prefix="/assessments", tags=["Disease Screening Assessments"])
api_router.include_router(trends.router, prefix="/trends", tags=["Personal Baseline Trends"])
api_router.include_router(recommendations.router, prefix="/recommendations", tags=["Preventive Recommendations"])
api_router.include_router(habits.router, prefix="/habits", tags=["Daily Preventive Habits"])
api_router.include_router(plans.router, prefix="/plans", tags=["Personalized Preventive Plans"])
api_router.include_router(wellbeing.router, prefix="/wellbeing", tags=["Subjective Wellbeing & Reflection"])
api_router.include_router(export.router, prefix="/export", tags=["Data Portability & Deletion"])
