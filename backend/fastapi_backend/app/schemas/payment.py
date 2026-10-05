from decimal import Decimal

from pydantic import BaseModel, Field


class PaymentCreate(BaseModel):
    user_id: int = Field(
        gt=0,
    )

    card_id: int = Field(
        gt=0,
    )

    amount: Decimal = Field(
        gt=0,
        max_digits=12,
        decimal_places=2,
    )

    currency: str = Field(
        default="INR",
        min_length=3,
        max_length=3,
    )


class PaymentResponse(BaseModel):
    transaction_id: str
    user_id: int
    card_id: int
    amount: Decimal
    currency: str
    status: str
    message: str