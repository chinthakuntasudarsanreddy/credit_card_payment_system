import json
import os
import random
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from fastapi import HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.models.transaction import Transaction
from app.schemas.payment import PaymentCreate, PaymentResponse


def _django_request(
    endpoint: str,
    payload: dict,
) -> bool:
    """
    Send an internal notification request to Django.

    Notification failures must never cause a successful
    payment to fail.
    """

    django_base_url = os.getenv(
        "DJANGO_BASE_URL",
        "http://django:8000",
    ).rstrip("/")

    internal_api_key = os.getenv(
        "INTERNAL_API_KEY",
        "",
    )

    if not internal_api_key:
        print(
            "Notification skipped: "
            "INTERNAL_API_KEY is not configured."
        )
        return False

    url = f"{django_base_url}{endpoint}"

    request_payload = json.dumps(payload).encode("utf-8")

    request = Request(
        url=url,
        data=request_payload,
        headers={
            "Content-Type": "application/json",
            "X-Internal-API-Key": internal_api_key,
        },
        method="POST",
    )

    try:
        with urlopen(request, timeout=10) as response:
            response_body = response.read().decode("utf-8")

            print(
                "Django notification response:",
                response_body,
            )

            return 200 <= response.status < 300

    except HTTPError as exc:
        print(
            "Django notification HTTP error:",
            exc.code,
            exc.reason,
        )
        return False

    except URLError as exc:
        print(
            "Django notification connection error:",
            exc.reason,
        )
        return False

    except Exception as exc:
        print(
            "Django notification unexpected error:",
            exc,
        )
        return False


def send_high_value_transaction_notification(
    transaction_id: str,
) -> bool:
    """
    Notify Django when a successful INR transaction
    exceeds ₹5000.
    """

    return _django_request(
        "/api/notifications/internal/transaction/",
        {
            "transaction_id": transaction_id,
        },
    )


def send_low_credit_limit_notification(
    card_id: int,
    available_credit_limit: Decimal,
    credit_limit: Decimal,
) -> bool:
    """
    Notify Django when available credit falls below 10%.
    """

    return _django_request(
        "/api/notifications/internal/low-credit/",
        {
            "card_id": card_id,
            "available_credit_limit": str(
                available_credit_limit
            ),
            "credit_limit": str(
                credit_limit
            ),
        },
    )


def get_card_credit_information(
    db: Session,
    card_id: int,
) -> tuple[Decimal, Decimal] | None:
    """
    Get card credit limit and calculate available credit.

    Only SUCCESS transactions are counted as spent credit.

    Returns:
        (available_credit_limit, credit_limit)
    """

    row = db.execute(
        text(
            """
            SELECT
                c.credit_limit,
                COALESCE(
                    SUM(
                        CASE
                            WHEN t.status = 'SUCCESS'
                            THEN t.amount
                            ELSE 0
                        END
                    ),
                    0
                ) AS total_spent
            FROM cards_card c
            LEFT JOIN transactions_transaction t
                ON t.card_id = c.id
            WHERE c.id = :card_id
            GROUP BY c.id, c.credit_limit
            """
        ),
        {
            "card_id": card_id,
        },
    ).mappings().first()

    if not row:
        return None

    credit_limit = Decimal(
        str(row["credit_limit"])
    )

    total_spent = Decimal(
        str(row["total_spent"] or 0)
    )

    available_credit_limit = (
        credit_limit - total_spent
    )

    if available_credit_limit < Decimal("0.00"):
        available_credit_limit = Decimal("0.00")

    return (
        available_credit_limit,
        credit_limit,
    )


def get_card_information(
    db: Session,
    card_id: int,
    user_id: int,
):
    """
    Verify that the card belongs to the authenticated user
    and return card details.
    """

    row = db.execute(
        text(
            """
            SELECT
                id,
                user_id,
                card_holder_name,
                masked_card_number,
                last_four_digits,
                expiry_month,
                expiry_year,
                card_type,
                status,
                credit_limit
            FROM cards_card
            WHERE id = :card_id
              AND user_id = :user_id
            """
        ),
        {
            "card_id": card_id,
            "user_id": user_id,
        },
    ).mappings().first()

    return row


def process_payment(
    payment: PaymentCreate,
    db: Session,
) -> PaymentResponse:

    # --------------------------------------------------
    # VERIFY CARD OWNERSHIP
    # --------------------------------------------------

    card = get_card_information(
        db=db,
        card_id=payment.card_id,
        user_id=payment.user_id,
    )

    if not card:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Card not found for this user.",
        )

    # --------------------------------------------------
    # VERIFY CARD STATUS
    # --------------------------------------------------

    if card["status"] != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Payment cannot be processed because "
                "this card is BLOCKED."
            ),
        )

    # --------------------------------------------------
    # NORMALIZE CURRENCY
    # --------------------------------------------------

    currency = payment.currency.upper()

    if currency not in {"INR", "USD"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported currency. Use INR or USD.",
        )

    # --------------------------------------------------
    # CHECK AVAILABLE CREDIT
    # --------------------------------------------------

    credit_information = (
        get_card_credit_information(
            db=db,
            card_id=payment.card_id,
        )
    )

    if credit_information:
        (
            available_credit_limit,
            credit_limit,
        ) = credit_information

        # Credit validation applies to INR payments.
        if currency == "INR":
            if payment.amount > available_credit_limit:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        "Insufficient available credit. "
                        f"Available credit is "
                        f"₹{available_credit_limit}."
                    ),
                )

    # --------------------------------------------------
    # CREATE PENDING TRANSACTION
    # --------------------------------------------------

    transaction_id = str(uuid.uuid4())

    now = datetime.now(
        timezone.utc
    ).replace(tzinfo=None)

    transaction = Transaction(
        user_id=payment.user_id,
        card_id=payment.card_id,
        transaction_id=transaction_id,
        amount=payment.amount,
        currency=currency,
        status="PENDING",
        payment_message="Payment is being processed.",
        created_at=now,
        updated_at=now,
    )

    db.add(transaction)
    db.commit()
    db.refresh(transaction)

    # --------------------------------------------------
    # SIMULATE PAYMENT PROCESSING
    # --------------------------------------------------

    payment_success = random.choice(
        [True, False]
    )

    if payment_success:
        transaction.status = "SUCCESS"

        transaction.payment_message = (
            "Payment processed successfully."
        )

        message = (
            "Payment processed successfully."
        )

    else:
        transaction.status = "FAILED"

        transaction.payment_message = (
            "Payment processing failed."
        )

        message = (
            "Payment processing failed."
        )

    transaction.updated_at = (
        datetime.now(
            timezone.utc
        ).replace(tzinfo=None)
    )

    db.commit()
    db.refresh(transaction)

    # --------------------------------------------------
    # HIGH-VALUE TRANSACTION ALERT
    # --------------------------------------------------

    if (
        transaction.status == "SUCCESS"
        and transaction.currency == "INR"
        and transaction.amount > Decimal("5000")
    ):
        send_high_value_transaction_notification(
            transaction.transaction_id
        )

    # --------------------------------------------------
    # LOW AVAILABLE CREDIT ALERT
    # --------------------------------------------------

    if (
        transaction.status == "SUCCESS"
        and transaction.currency == "INR"
    ):
        credit_information = (
            get_card_credit_information(
                db=db,
                card_id=transaction.card_id,
            )
        )

        if credit_information:
            (
                available_credit_limit,
                credit_limit,
            ) = credit_information

            if credit_limit > Decimal("0.00"):

                available_percentage = (
                    available_credit_limit
                    / credit_limit
                ) * Decimal("100")

                print(
                    "Card credit information:",
                    {
                        "card_id": transaction.card_id,
                        "credit_limit": str(
                            credit_limit
                        ),
                        "available_credit": str(
                            available_credit_limit
                        ),
                        "available_percentage":
                            f"{available_percentage:.2f}%",
                    },
                )

                if (
                    available_percentage
                    < Decimal("10")
                ):
                    send_low_credit_limit_notification(
                        card_id=transaction.card_id,
                        available_credit_limit=(
                            available_credit_limit
                        ),
                        credit_limit=credit_limit,
                    )

    return PaymentResponse(
        transaction_id=transaction.transaction_id,
        user_id=transaction.user_id,
        card_id=transaction.card_id,
        amount=transaction.amount,
        currency=transaction.currency,
        status=transaction.status,
        message=message,
    )