from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.services.plan_service import get_or_create_active_plan
from app.schemas.preventive_plan import PreventivePlanResponse

router = APIRouter()


@router.get("/", status_code=status.HTTP_200_OK)
def get_preventive_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves tailored, evidence-informed lifestyle recommendations
    grounded in the user's active persistent preventive plan.
    """
    plan = get_or_create_active_plan(db=db, user_id=current_user.id)
    
    recs_list = [
        {
            "id": item.id,
            "category": item.category,
            "title": item.title,
            "target_action": item.target_action,
            "rationale": item.rationale,
            "guideline_source": item.guideline_source,
            "difficulty": item.difficulty,
            "is_adopted_into_habit": item.is_adopted_into_habit,
            "adopted_habit_id": item.adopted_habit_id,
        }
        for item in plan.items
    ]

    return {
        "user_id": current_user.id,
        "plan_id": plan.id,
        "plan_title": plan.title,
        "recommendations_count": len(recs_list),
        "recommendations": recs_list,
    }
