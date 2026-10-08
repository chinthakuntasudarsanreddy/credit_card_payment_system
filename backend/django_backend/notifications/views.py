from decimal import Decimal

from django.conf import settings
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from cards.models import Card
from transactions.models import Transaction

from .services import (
    send_card_blocked_alert,
    send_low_credit_limit_alert,
    send_transaction_amount_alert,
)


class InternalTransactionNotificationView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        expected_key = getattr(settings, "INTERNAL_API_KEY", "")
        received_key = request.headers.get("X-Internal-API-Key", "")

        if not expected_key:
            return Response(
                {"detail": "Internal API key is not configured."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        if received_key != expected_key:
            return Response(
                {"detail": "Invalid internal API key."},
                status=status.HTTP_403_FORBIDDEN,
            )

        transaction_id = request.data.get("transaction_id")

        if not transaction_id:
            return Response(
                {"detail": "transaction_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            transaction = (
                Transaction.objects
                .select_related("user", "card")
                .get(transaction_id=transaction_id)
            )
        except Transaction.DoesNotExist:
            return Response(
                {"detail": "Transaction not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if (
            transaction.currency != "INR"
            or transaction.amount <= Decimal("5000")
            or transaction.status != "SUCCESS"
        ):
            return Response(
                {
                    "message": "Transaction does not meet the alert criteria.",
                    "notification_sent": False,
                },
                status=status.HTTP_200_OK,
            )

        try:
            notification_sent = send_transaction_amount_alert(
                transaction
            )
        except Exception as exc:
            return Response(
                {
                    "message": "Transaction alert could not be sent.",
                    "notification_sent": False,
                    "error": str(exc),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {
                "message": "Transaction alert processed.",
                "notification_sent": notification_sent,
            },
            status=status.HTTP_200_OK,
        )


class InternalLowCreditNotificationView(APIView):
    """
    Internal endpoint used by FastAPI to trigger
    the low available credit email notification.
    """

    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        expected_key = getattr(settings, "INTERNAL_API_KEY", "")
        received_key = request.headers.get("X-Internal-API-Key", "")

        if not expected_key:
            return Response(
                {"detail": "Internal API key is not configured."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        if received_key != expected_key:
            return Response(
                {"detail": "Invalid internal API key."},
                status=status.HTTP_403_FORBIDDEN,
            )

        card_id = request.data.get("card_id")
        available_credit_limit = request.data.get(
            "available_credit_limit"
        )
        credit_limit = request.data.get("credit_limit")

        if not card_id:
            return Response(
                {"detail": "card_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if available_credit_limit is None:
            return Response(
                {
                    "detail": (
                        "available_credit_limit is required."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if credit_limit is None:
            return Response(
                {"detail": "credit_limit is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            card = (
                Card.objects
                .select_related("user")
                .get(id=card_id)
            )
        except Card.DoesNotExist:
            return Response(
                {"detail": "Card not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            available_credit = Decimal(
                str(available_credit_limit)
            )
            card_credit_limit = Decimal(
                str(credit_limit)
            )
        except Exception:
            return Response(
                {"detail": "Credit limit values must be numeric."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if card_credit_limit <= Decimal("0"):
            return Response(
                {
                    "message": "Credit limit is not valid.",
                    "notification_sent": False,
                },
                status=status.HTTP_200_OK,
            )

        percentage = (
            available_credit / card_credit_limit
        ) * Decimal("100")

        # Notification is required only when available
        # credit is below 10%.
        if percentage >= Decimal("10"):
            return Response(
                {
                    "message": "Available credit is not below 10%.",
                    "notification_sent": False,
                    "available_credit_limit": str(
                        available_credit
                    ),
                    "credit_limit": str(
                        card_credit_limit
                    ),
                    "available_percentage": f"{percentage:.2f}",
                },
                status=status.HTTP_200_OK,
            )

        try:
            notification_sent = send_low_credit_limit_alert(
                card=card,
                available_credit_limit=available_credit,
                credit_limit=card_credit_limit,
            )
        except Exception as exc:
            return Response(
                {
                    "message": (
                        "Low-credit notification could not be sent."
                    ),
                    "notification_sent": False,
                    "error": str(exc),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {
                "message": "Low-credit alert processed.",
                "notification_sent": notification_sent,
                "available_credit_limit": str(
                    available_credit
                ),
                "credit_limit": str(
                    card_credit_limit
                ),
                "available_percentage": f"{percentage:.2f}",
            },
            status=status.HTTP_200_OK,
        )


class InternalCardBlockedNotificationView(APIView):
    """
    Internal endpoint for card-block notification.
    """

    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        expected_key = getattr(settings, "INTERNAL_API_KEY", "")
        received_key = request.headers.get("X-Internal-API-Key", "")

        if not expected_key:
            return Response(
                {"detail": "Internal API key is not configured."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        if received_key != expected_key:
            return Response(
                {"detail": "Invalid internal API key."},
                status=status.HTTP_403_FORBIDDEN,
            )

        card_id = request.data.get("card_id")

        if not card_id:
            return Response(
                {"detail": "card_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            card = (
                Card.objects
                .select_related("user")
                .get(id=card_id)
            )
        except Card.DoesNotExist:
            return Response(
                {"detail": "Card not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            notification_sent = send_card_blocked_alert(card)
        except Exception as exc:
            return Response(
                {
                    "message": (
                        "Card blocked notification could not be sent."
                    ),
                    "notification_sent": False,
                    "error": str(exc),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {
                "message": "Card blocked alert processed.",
                "notification_sent": notification_sent,
            },
            status=status.HTTP_200_OK,
        )