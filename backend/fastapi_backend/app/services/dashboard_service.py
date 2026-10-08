from decimal import Decimal

from sqlalchemy import text
from sqlalchemy.orm import Session


DEFAULT_CREDIT_LIMIT = Decimal("100000.00")


def get_dashboard_summary(
    db: Session,
    user_id: int,
):
    # ============================================================
    # TOTAL TRANSACTIONS
    # Only successful transactions are treated as spending.
    # Only the authenticated user's transactions are counted.
    # ============================================================

    total_transactions = db.execute(
        text(
            """
            SELECT COUNT(*)
            FROM transactions_transaction
            WHERE user_id = :user_id
              AND status = 'SUCCESS'
            """
        ),
        {
            "user_id": user_id,
        },
    ).scalar() or 0

    # ============================================================
    # TOTAL AMOUNT SPENT
    # ============================================================

    total_amount_spent = db.execute(
        text(
            """
            SELECT COALESCE(SUM(amount), 0)
            FROM transactions_transaction
            WHERE user_id = :user_id
              AND status = 'SUCCESS'
            """
        ),
        {
            "user_id": user_id,
        },
    ).scalar()

    if total_amount_spent is None:
        total_amount_spent = Decimal("0.00")

    # ============================================================
    # CURRENT MONTH SPENDING
    # ============================================================

    current_month_spending = db.execute(
        text(
            """
            SELECT COALESCE(SUM(amount), 0)
            FROM transactions_transaction
            WHERE user_id = :user_id
              AND status = 'SUCCESS'
              AND YEAR(created_at) = YEAR(CURDATE())
              AND MONTH(created_at) = MONTH(CURDATE())
            """
        ),
        {
            "user_id": user_id,
        },
    ).scalar()

    if current_month_spending is None:
        current_month_spending = Decimal("0.00")

    # ============================================================
    # AVAILABLE CREDIT LIMIT
    #
    # Current Card model does not contain a credit limit.
    # Therefore the configured default credit limit is used.
    #
    # This calculation is based on the authenticated user's
    # current-month successful spending.
    # ============================================================

    available_credit_limit = (
        DEFAULT_CREDIT_LIMIT
        - Decimal(str(current_month_spending))
    )

    if available_credit_limit < Decimal("0.00"):
        available_credit_limit = Decimal("0.00")

    # ============================================================
    # LAST 5 TRANSACTIONS
    #
    # Only the authenticated user's transactions are returned.
    # The card table is joined to get the masked card number.
    # ============================================================

    rows = db.execute(
        text(
            """
            SELECT
                t.amount,
                c.masked_card_number,
                t.created_at,
                t.status
            FROM transactions_transaction t
            LEFT JOIN cards_card c
                ON t.card_id = c.id
            WHERE t.user_id = :user_id
            ORDER BY t.created_at DESC
            LIMIT 5
            """
        ),
        {
            "user_id": user_id,
        },
    ).mappings().all()

    last_5_transactions = []

    for row in rows:
        last_5_transactions.append(
            {
                "amount": str(row["amount"]),
                "masked_card_number": (
                    row["masked_card_number"]
                    if row["masked_card_number"]
                    else None
                ),
                "date": (
                    row["created_at"].isoformat()
                    if row["created_at"]
                    else None
                ),
                "status": row["status"],
            }
        )

    # ============================================================
    # FINAL RESPONSE
    # ============================================================

    return {
        "total_transactions": total_transactions,
        "total_amount_spent": str(total_amount_spent),
        "current_month_spending": str(
            current_month_spending
        ),
        "available_credit_limit": str(
            available_credit_limit
        ),
        "last_5_transactions": last_5_transactions,
    }