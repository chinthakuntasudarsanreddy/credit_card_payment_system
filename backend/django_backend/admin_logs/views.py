from datetime import datetime, time

from django.db.models import Count, Sum
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from transactions.models import Transaction


class DailyPaymentSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != "admin":
            return Response(
                {"detail": "Admin access required."},
                status=status.HTTP_403_FORBIDDEN,
            )

        date_string = request.query_params.get("date")

        if date_string:
            try:
                selected_date = datetime.strptime(
                    date_string,
                    "%Y-%m-%d",
                ).date()
            except ValueError:
                return Response(
                    {
                        "detail": (
                            "Invalid date format. "
                            "Use YYYY-MM-DD."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            selected_date = timezone.localdate()

        start_datetime = timezone.make_aware(
            datetime.combine(
                selected_date,
                time.min,
            )
        )

        end_datetime = timezone.make_aware(
            datetime.combine(
                selected_date,
                time.max,
            )
        )

        transactions = Transaction.objects.filter(
            created_at__gte=start_datetime,
            created_at__lte=end_datetime,
        )

        summary = transactions.aggregate(
            total_transactions=Count("id"),
            total_amount=Sum("amount"),
        )

        status_summary = transactions.values(
            "status"
        ).annotate(
            count=Count("id"),
            amount=Sum("amount"),
        ).order_by("status")

        return Response(
            {
                "date": selected_date,
                "total_transactions": (
                    summary["total_transactions"] or 0
                ),
                "total_amount": (
                    summary["total_amount"] or 0
                ),
                "status_summary": list(status_summary),
            },
            status=status.HTTP_200_OK,
        )