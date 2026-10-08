from decimal import Decimal, InvalidOperation

from django.db.models import Count, Sum
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Card


def is_admin(user):
    return (
        user.is_authenticated
        and (
            user.is_staff
            or user.is_superuser
            or user.role == "admin"
        )
    )


class AdminCardListView(APIView):
    """
    Admin-only:
    GET /api/cards/admin/
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_admin(request.user):
            return Response(
                {"detail": "Admin access required."},
                status=status.HTTP_403_FORBIDDEN,
            )

        cards = (
            Card.objects
            .select_related("user")
            .annotate(
                transaction_count=Count("transactions"),
                successful_transactions=Count(
                    "transactions",
                    filter=__import__("django.db.models", fromlist=["Q"]).Q(
                        transactions__status="SUCCESS"
                    ),
                ),
                total_spent=Sum(
                    "transactions__amount",
                    filter=__import__("django.db.models", fromlist=["Q"]).Q(
                        transactions__status="SUCCESS"
                    ),
                ),
            )
            .order_by("-created_at")
        )

        data = []

        for card in cards:
            total_spent = card.total_spent or Decimal("0.00")

            data.append(
                {
                    "id": card.id,
                    "user_id": card.user_id,
                    "username": card.user.username,
                    "email": card.user.email,
                    "card_holder_name": card.card_holder_name,
                    "masked_card_number": card.masked_card_number,
                    "last_four_digits": card.last_four_digits,
                    "expiry_month": card.expiry_month,
                    "expiry_year": card.expiry_year,
                    "card_type": card.card_type,
                    "status": card.status,
                    "credit_limit": str(card.credit_limit),
                    "transaction_count": card.transaction_count,
                    "successful_transactions": card.successful_transactions,
                    "total_spent": str(total_spent),
                    "available_credit": str(
                        max(
                            Decimal("0.00"),
                            card.credit_limit - total_spent,
                        )
                    ),
                    "created_at": card.created_at,
                    "updated_at": card.updated_at,
                }
            )

        return Response(data)


class AdminCardDetailView(APIView):
    """
    Admin-only:

    GET   /api/cards/admin/<card_id>/
    PATCH /api/cards/admin/<card_id>/

    PATCH supports:
    {
        "status": "ACTIVE"
    }

    or:

    {
        "status": "BLOCKED"
    }

    or:

    {
        "credit_limit": "150000.00"
    }
    """

    permission_classes = [IsAuthenticated]

    def get_card(self, card_id):
        try:
            return Card.objects.select_related("user").get(id=card_id)
        except Card.DoesNotExist:
            return None

    def get(self, request, card_id):
        if not is_admin(request.user):
            return Response(
                {"detail": "Admin access required."},
                status=status.HTTP_403_FORBIDDEN,
            )

        card = self.get_card(card_id)

        if card is None:
            return Response(
                {"detail": "Card not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        transactions = card.transactions.order_by("-created_at")

        total_transactions = transactions.count()
        successful_transactions = transactions.filter(
            status="SUCCESS"
        ).count()
        failed_transactions = transactions.filter(
            status="FAILED"
        ).count()

        total_spent = (
            transactions
            .filter(status="SUCCESS")
            .aggregate(total=Sum("amount"))["total"]
            or Decimal("0.00")
        )

        activity = []

        for transaction in transactions[:20]:
            activity.append(
                {
                    "transaction_id": transaction.transaction_id,
                    "amount": str(transaction.amount),
                    "currency": transaction.currency,
                    "status": transaction.status,
                    "payment_message": transaction.payment_message,
                    "created_at": transaction.created_at,
                }
            )

        return Response(
            {
                "card": {
                    "id": card.id,
                    "user_id": card.user_id,
                    "username": card.user.username,
                    "email": card.user.email,
                    "card_holder_name": card.card_holder_name,
                    "masked_card_number": card.masked_card_number,
                    "last_four_digits": card.last_four_digits,
                    "expiry_month": card.expiry_month,
                    "expiry_year": card.expiry_year,
                    "card_type": card.card_type,
                    "status": card.status,
                    "credit_limit": str(card.credit_limit),
                    "available_credit": str(
                        max(
                            Decimal("0.00"),
                            card.credit_limit - total_spent,
                        )
                    ),
                    "created_at": card.created_at,
                    "updated_at": card.updated_at,
                },
                "activity_summary": {
                    "total_transactions": total_transactions,
                    "successful_transactions": successful_transactions,
                    "failed_transactions": failed_transactions,
                    "total_spent": str(total_spent),
                },
                "activity": activity,
            }
        )

    def patch(self, request, card_id):
        if not is_admin(request.user):
            return Response(
                {"detail": "Admin access required."},
                status=status.HTTP_403_FORBIDDEN,
            )

        card = self.get_card(card_id)

        if card is None:
            return Response(
                {"detail": "Card not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        changed = []

        if "status" in request.data:
            new_status = str(
                request.data.get("status")
            ).upper()

            if new_status not in {"ACTIVE", "BLOCKED"}:
                return Response(
                    {
                        "detail": (
                            "Invalid status. "
                            "Use ACTIVE or BLOCKED."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if card.status != new_status:
                card.status = new_status
                changed.append("status")

        if "credit_limit" in request.data:
            try:
                credit_limit = Decimal(
                    str(request.data.get("credit_limit"))
                )
            except (InvalidOperation, TypeError, ValueError):
                return Response(
                    {"detail": "Invalid credit_limit."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if credit_limit <= 0:
                return Response(
                    {
                        "detail": (
                            "credit_limit must be greater than 0."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if credit_limit > Decimal("9999999999.99"):
                return Response(
                    {"detail": "credit_limit is too large."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if card.credit_limit != credit_limit:
                card.credit_limit = credit_limit
                changed.append("credit_limit")

        if not changed:
            return Response(
                {
                    "detail": "No changes supplied.",
                    "card_id": card.id,
                    "status": card.status,
                    "credit_limit": str(card.credit_limit),
                }
            )

        card.save()

        return Response(
            {
                "message": "Card updated successfully.",
                "updated_fields": changed,
                "card": {
                    "id": card.id,
                    "masked_card_number": card.masked_card_number,
                    "status": card.status,
                    "credit_limit": str(card.credit_limit),
                },
            }
        )