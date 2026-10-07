from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.database import get_db
from app.services.dashboard_service import get_dashboard_summary


router = APIRouter()


@router.get(
    "/summary",
    summary="Get authenticated user's dashboard summary",
)
def dashboard_summary(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_dashboard_summary(
        db=db,
        user_id=current_user["id"],
    )