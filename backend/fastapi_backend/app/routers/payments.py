from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.payment import (
    PaymentCreate,
    PaymentResponse,
)
from app.services.payment_service import (
    process_payment,
)


router = APIRouter()


@router.post(
    "/",
    response_model=PaymentResponse,
)
def make_payment(
    payment: PaymentCreate,
    db: Session = Depends(get_db),
):
    return process_payment(
        payment,
        db,
    )