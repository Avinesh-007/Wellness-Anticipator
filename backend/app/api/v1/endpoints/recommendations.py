from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.services.risk_service import perform_diabetes_assessment
from app.services.trend_engine import calculate_user_trends
from app.services.recommendation_service import generate_recommendations

router = APIRouter()


@router.get("/", status_code=status.HTTP_200_OK)
def get_preventive_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves tailored, evidence-informed lifestyle recommendations
    synthesized from the user's latest assessment and 14-day longitudinal trends.
    """
    assessment = perform_diabetes_assessment(db=db, user_id=current_user.id)
    trends = calculate_user_trends(db=db, user_id=current_user.id, window_days=14)
    recs = generate_recommendations(assessment_summary=assessment, trends_summary=trends)
    
    return {
        "user_id": current_user.id,
        "recommendations_count": len(recs),
        "recommendations": [asdict_obj for asdict_obj in recs]
    }
