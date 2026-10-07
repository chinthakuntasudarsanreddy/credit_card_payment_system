from decimal import Decimal

from sqlalchemy import text
from sqlalchemy.orm import Session


DEFAULT_CREDIT_LIMIT = Decimal("100000.00")


def get_dashboard_summary(db: Session):
    # ============================================================
    # TOTAL TRANSACTIONS
    # Only successful transactions are treated as spending.
    # ============================================================

    total_transactions = db.execute(
        text(
            """
            SELECT COUNT(*)
            FROM transactions_transaction
            WHERE status = 'SUCCESS'
            """
        )
    ).scalar() or 0

    # ============================================================
    # TOTAL AMOUNT SPENT
    # ============================================================

    total_amount_spent = db.execute(
        text(
            """
            SELECT COALESCE(SUM(amount), 0)
            FROM transactions_transaction
            WHERE status = 'SUCCESS'
            """
        )
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
            WHERE status = 'SUCCESS'
              AND YEAR(created_at) = YEAR(CURDATE())
              AND MONTH(created_at) = MONTH(CURDATE())
            """
        )
    ).scalar()

    if current_month_spending is None:
        current_month_spending = Decimal("0.00")

    # ============================================================
    # AVAILABLE CREDIT LIMIT
    #
    # Current Card model/database does not contain a credit limit.
    # Therefore we use the configured default credit limit.
    # ============================================================

    available_credit_limit = (
        DEFAULT_CREDIT_LIMIT - Decimal(str(current_month_spending))
    )

    if available_credit_limit < Decimal("0.00"):
        available_credit_limit = Decimal("0.00")

    # ============================================================
    # LAST 5 TRANSACTIONS
    #
    # The card table is joined so that we can return the masked
    # card number.
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
            ORDER BY t.created_at DESC
            LIMIT 5
            """
        )
    ).mappings().all()

    last_5_transactions = []

    for row in rows:
        last_5_transactions.append(
            {
                "amount": str(row["amount"]),
                "masked_card_number": row["masked_card_number"],
                "date": row["created_at"].isoformat()
                if row["created_at"]
                else None,
                "status": row["status"],
            }
        )

    # ============================================================
    # FINAL RESPONSE
    # ============================================================

    return {
        "total_transactions": total_transactions,
        "total_amount_spent": str(total_amount_spent),
        "current_month_spending": str(current_month_spending),
        "available_credit_limit": str(available_credit_limit),
        "last_5_transactions": last_5_transactions,
    }