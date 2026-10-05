import csv
from datetime import datetime, time

from django.http import HttpResponse
from django.db.models import Q
from django.utils import timezone

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Transaction
from .serializers import TransactionSerializer


class TransactionListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        transactions = (
            Transaction.objects
            .filter(user=request.user)
            .select_related("card")
            .order_by("-created_at")
        )

        # ---------------------------------------------------------
        # STATUS FILTER
        # ---------------------------------------------------------
        transaction_status = request.query_params.get("status")

        if transaction_status:
            transaction_status = transaction_status.upper()

            if transaction_status not in ["PENDING", "SUCCESS", "FAILED"]:
                return Response(
                    {
                        "detail": (
                            "Invalid status. "
                            "Use PENDING, SUCCESS or FAILED."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            transactions = transactions.filter(
                status=transaction_status
            )

        # ---------------------------------------------------------
        # MINIMUM AMOUNT FILTER
        # ---------------------------------------------------------
        min_amount = request.query_params.get("min_amount")

        if min_amount:
            try:
                transactions = transactions.filter(
                    amount__gte=min_amount
                )
            except Exception:
                return Response(
                    {"detail": "Invalid min_amount."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # ---------------------------------------------------------
        # MAXIMUM AMOUNT FILTER
        # ---------------------------------------------------------
        max_amount = request.query_params.get("max_amount")

        if max_amount:
            try:
                transactions = transactions.filter(
                    amount__lte=max_amount
                )
            except Exception:
                return Response(
                    {"detail": "Invalid max_amount."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # ---------------------------------------------------------
        # SEARCH FILTER
        # ---------------------------------------------------------
        search = request.query_params.get("search")

        if search:
            transactions = transactions.filter(
                Q(transaction_id__icontains=search)
            )

        # ---------------------------------------------------------
        # DATE FROM FILTER
        # Example:
        # ?date_from=2026-10-01
        # ---------------------------------------------------------
        date_from = request.query_params.get("date_from")

        if date_from:
            try:
                parsed_date_from = datetime.strptime(
                    date_from,
                    "%Y-%m-%d"
                ).date()

                start_datetime = timezone.make_aware(
                    datetime.combine(
                        parsed_date_from,
                        time.min
                    )
                )

                transactions = transactions.filter(
                    created_at__gte=start_datetime
                )

            except ValueError:
                return Response(
                    {
                        "detail": (
                            "Invalid date_from format. "
                            "Use YYYY-MM-DD."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # ---------------------------------------------------------
        # DATE TO FILTER
        # Example:
        # ?date_to=2026-10-05
        # ---------------------------------------------------------
        date_to = request.query_params.get("date_to")

        if date_to:
            try:
                parsed_date_to = datetime.strptime(
                    date_to,
                    "%Y-%m-%d"
                ).date()

                end_datetime = timezone.make_aware(
                    datetime.combine(
                        parsed_date_to,
                        time.max
                    )
                )

                transactions = transactions.filter(
                    created_at__lte=end_datetime
                )

            except ValueError:
                return Response(
                    {
                        "detail": (
                            "Invalid date_to format. "
                            "Use YYYY-MM-DD."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # ---------------------------------------------------------
        # VALIDATE DATE RANGE
        # ---------------------------------------------------------
        if date_from and date_to:
            if parsed_date_from > parsed_date_to:
                return Response(
                    {
                        "detail": (
                            "date_from cannot be later "
                            "than date_to."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        serializer = TransactionSerializer(
            transactions,
            many=True
        )

        return Response(
            {
                "count": transactions.count(),
                "results": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class TransactionDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, transaction_id):
        try:
            transaction = (
                Transaction.objects
                .select_related("card")
                .get(
                    transaction_id=transaction_id,
                    user=request.user,
                )
            )

        except Transaction.DoesNotExist:
            return Response(
                {"detail": "Transaction not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = TransactionSerializer(transaction)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )


class TransactionCSVExportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != "admin":
            return Response(
                {"detail": "Admin access required."},
                status=status.HTTP_403_FORBIDDEN,
            )

        transactions = (
            Transaction.objects
            .select_related("user", "card")
            .order_by("-created_at")
        )

        response = HttpResponse(
            content_type="text/csv"
        )

        response["Content-Disposition"] = (
            'attachment; filename="transactions.csv"'
        )

        writer = csv.writer(response)

        writer.writerow(
            [
                "Transaction ID",
                "User",
                "Amount",
                "Currency",
                "Status",
                "Card",
                "Payment Message",
                "Created At",
            ]
        )

        for transaction in transactions:

            card_number = ""

            if transaction.card:
                card_number = (
                    transaction.card.masked_card_number
                )

            writer.writerow(
                [
                    transaction.transaction_id,
                    transaction.user.username,
                    transaction.amount,
                    transaction.currency,
                    transaction.status,
                    card_number,
                    transaction.payment_message,
                    transaction.created_at,
                ]
            )

        return response