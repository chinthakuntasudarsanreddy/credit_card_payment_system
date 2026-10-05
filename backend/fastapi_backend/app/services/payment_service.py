import random
import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.transaction import Transaction
from app.schemas.payment import PaymentCreate, PaymentResponse


def process_payment(
    payment: PaymentCreate,
    db: Session,
) -> PaymentResponse:

    transaction_id = str(uuid.uuid4())

    now = datetime.now(timezone.utc).replace(tzinfo=None)

    transaction = Transaction(
        user_id=payment.user_id,
        card_id=payment.card_id,
        transaction_id=transaction_id,
        amount=payment.amount,
        currency=payment.currency.upper(),
        status="PENDING",
        payment_message="Payment is being processed.",
        created_at=now,
        updated_at=now,
    )

    db.add(transaction)
    db.commit()
    db.refresh(transaction)

    payment_success = random.choice([True, False])

    if payment_success:
        transaction.status = "SUCCESS"
        transaction.payment_message = "Payment processed successfully."
        message = "Payment processed successfully."
    else:
        transaction.status = "FAILED"
        transaction.payment_message = "Payment processing failed."
        message = "Payment processing failed."

    transaction.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)

    db.commit()
    db.refresh(transaction)

    return PaymentResponse(
        transaction_id=transaction.transaction_id,
        user_id=transaction.user_id,
        card_id=transaction.card_id,
        amount=transaction.amount,
        currency=transaction.currency,
        status=transaction.status,
        message=message,
    )