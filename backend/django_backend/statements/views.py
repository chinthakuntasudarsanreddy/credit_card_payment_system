from calendar import monthrange
from datetime import datetime
from decimal import Decimal

from django.http import HttpResponse
from django.utils import timezone

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from transactions.models import Transaction


class MonthlyStatementPDFView(APIView):
    """
    Generate a monthly PDF statement for the authenticated user.

    Example:
    GET /api/statements/monthly/?year=2026&month=10
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        # ---------------------------------------------------------
        # Validate year
        # ---------------------------------------------------------
        year_param = request.query_params.get("year")
        month_param = request.query_params.get("month")

        current_date = timezone.localdate()

        try:
            year = int(year_param) if year_param else current_date.year
            month = int(month_param) if month_param else current_date.month
        except (TypeError, ValueError):
            return Response(
                {
                    "detail": "Year and month must be valid numbers."
                },
                status=400,
            )

        if year < 2000 or year > 2100:
            return Response(
                {
                    "detail": "Year must be between 2000 and 2100."
                },
                status=400,
            )

        if month < 1 or month > 12:
            return Response(
                {
                    "detail": "Month must be between 1 and 12."
                },
                status=400,
            )

        # ---------------------------------------------------------
        # Calculate month range
        # ---------------------------------------------------------
        first_day = datetime(year, month, 1)

        last_day_number = monthrange(year, month)[1]
        last_day = datetime(
            year,
            month,
            last_day_number,
            23,
            59,
            59,
        )

        start_datetime = timezone.make_aware(first_day)
        end_datetime = timezone.make_aware(last_day)

        # ---------------------------------------------------------
        # Get only authenticated user's transactions
        # ---------------------------------------------------------
        transactions = list(
            Transaction.objects
            .filter(
                user=request.user,
                created_at__gte=start_datetime,
                created_at__lte=end_datetime,
            )
            .select_related("card")
            .order_by("created_at")
        )

        # ---------------------------------------------------------
        # Calculate summary
        # ---------------------------------------------------------
        total_transactions = len(transactions)

        successful_transactions = [
            transaction
            for transaction in transactions
            if transaction.status == "SUCCESS"
        ]

        failed_transactions = [
            transaction
            for transaction in transactions
            if transaction.status == "FAILED"
        ]

        total_spending = sum(
            (
                transaction.amount
                for transaction in successful_transactions
            ),
            Decimal("0.00"),
        )

        # ---------------------------------------------------------
        # PDF response
        # ---------------------------------------------------------
        filename = (
            f"CreditPay_Statement_{year}_{month:02d}.pdf"
        )

        response = HttpResponse(
            content_type="application/pdf"
        )

        response[
            "Content-Disposition"
        ] = f'attachment; filename="{filename}"'

        document = SimpleDocTemplate(
            response,
            pagesize=A4,
            rightMargin=15 * mm,
            leftMargin=15 * mm,
            topMargin=15 * mm,
            bottomMargin=15 * mm,
            title="CreditPay Monthly Statement",
            author="CreditPay",
        )

        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            "StatementTitle",
            parent=styles["Title"],
            fontSize=22,
            leading=26,
            alignment=TA_CENTER,
            spaceAfter=6,
        )

        subtitle_style = ParagraphStyle(
            "StatementSubtitle",
            parent=styles["Normal"],
            fontSize=10,
            leading=14,
            alignment=TA_CENTER,
            textColor=colors.grey,
            spaceAfter=16,
        )

        section_style = ParagraphStyle(
            "SectionTitle",
            parent=styles["Heading2"],
            fontSize=12,
            leading=15,
            alignment=TA_LEFT,
            spaceBefore=8,
            spaceAfter=8,
        )

        normal_style = ParagraphStyle(
            "StatementNormal",
            parent=styles["Normal"],
            fontSize=9,
            leading=12,
        )

        small_style = ParagraphStyle(
            "StatementSmall",
            parent=styles["Normal"],
            fontSize=7.5,
            leading=9,
        )

        right_style = ParagraphStyle(
            "StatementRight",
            parent=normal_style,
            alignment=TA_RIGHT,
        )

        story = []

        # ---------------------------------------------------------
        # Header
        # ---------------------------------------------------------
        story.append(
            Paragraph(
                "CreditPay",
                title_style,
            )
        )

        story.append(
            Paragraph(
                "MONTHLY CREDIT CARD STATEMENT",
                subtitle_style,
            )
        )

        statement_period = (
            f"{first_day.strftime('%d %b %Y')} - "
            f"{last_day.strftime('%d %b %Y')}"
        )

        # ---------------------------------------------------------
        # Customer information
        # ---------------------------------------------------------
        customer_name = (
            request.user.get_full_name()
            or request.user.username
        )

        customer_email = request.user.email or "-"

        card_numbers = []

        for transaction in transactions:
            if transaction.card:
                masked = transaction.card.masked_card_number
                if masked not in card_numbers:
                    card_numbers.append(masked)

        if card_numbers:
            card_display = "<br/>".join(card_numbers)
        else:
            card_display = "-"

        customer_data = [
            [
                Paragraph("<b>Customer</b>", normal_style),
                Paragraph(customer_name, normal_style),
                Paragraph("<b>Statement Period</b>", normal_style),
                Paragraph(statement_period, normal_style),
            ],
            [
                Paragraph("<b>Email</b>", normal_style),
                Paragraph(customer_email, normal_style),
                Paragraph("<b>Card</b>", normal_style),
                Paragraph(card_display, normal_style),
            ],
        ]

        customer_table = Table(
            customer_data,
            colWidths=[
                28 * mm,
                62 * mm,
                35 * mm,
                55 * mm,
            ],
        )

        customer_table.setStyle(
            TableStyle(
                [
                    (
                        "VALIGN",
                        (0, 0),
                        (-1, -1),
                        "TOP",
                    ),
                    (
                        "BACKGROUND",
                        (0, 0),
                        (0, -1),
                        colors.whitesmoke,
                    ),
                    (
                        "BACKGROUND",
                        (2, 0),
                        (2, -1),
                        colors.whitesmoke,
                    ),
                    (
                        "BOX",
                        (0, 0),
                        (-1, -1),
                        0.5,
                        colors.lightgrey,
                    ),
                    (
                        "INNERGRID",
                        (0, 0),
                        (-1, -1),
                        0.25,
                        colors.lightgrey,
                    ),
                    (
                        "LEFTPADDING",
                        (0, 0),
                        (-1, -1),
                        7,
                    ),
                    (
                        "RIGHTPADDING",
                        (0, 0),
                        (-1, -1),
                        7,
                    ),
                    (
                        "TOPPADDING",
                        (0, 0),
                        (-1, -1),
                        6,
                    ),
                    (
                        "BOTTOMPADDING",
                        (0, 0),
                        (-1, -1),
                        6,
                    ),
                ]
            )
        )

        story.append(customer_table)
        story.append(Spacer(1, 8 * mm))

        # ---------------------------------------------------------
        # Summary
        # ---------------------------------------------------------
        story.append(
            Paragraph(
                "Statement Summary",
                section_style,
            )
        )

        summary_data = [
            [
                Paragraph(
                    "<b>Total Transactions</b>",
                    normal_style,
                ),
                Paragraph(
                    str(total_transactions),
                    right_style,
                ),
            ],
            [
                Paragraph(
                    "<b>Successful Transactions</b>",
                    normal_style,
                ),
                Paragraph(
                    str(len(successful_transactions)),
                    right_style,
                ),
            ],
            [
                Paragraph(
                    "<b>Failed Transactions</b>",
                    normal_style,
                ),
                Paragraph(
                    str(len(failed_transactions)),
                    right_style,
                ),
            ],
            [
                Paragraph(
                    "<b>Total Spending</b>",
                    normal_style,
                ),
                Paragraph(
                    f"₹{total_spending:,.2f}",
                    right_style,
                ),
            ],
        ]

        summary_table = Table(
            summary_data,
            colWidths=[
                130 * mm,
                50 * mm,
            ],
        )

        summary_table.setStyle(
            TableStyle(
                [
                    (
                        "BOX",
                        (0, 0),
                        (-1, -1),
                        0.5,
                        colors.lightgrey,
                    ),
                    (
                        "INNERGRID",
                        (0, 0),
                        (-1, -1),
                        0.25,
                        colors.lightgrey,
                    ),
                    (
                        "BACKGROUND",
                        (0, 3),
                        (-1, 3),
                        colors.whitesmoke,
                    ),
                    (
                        "LEFTPADDING",
                        (0, 0),
                        (-1, -1),
                        8,
                    ),
                    (
                        "RIGHTPADDING",
                        (0, 0),
                        (-1, -1),
                        8,
                    ),
                    (
                        "TOPPADDING",
                        (0, 0),
                        (-1, -1),
                        6,
                    ),
                    (
                        "BOTTOMPADDING",
                        (0, 0),
                        (-1, -1),
                        6,
                    ),
                ]
            )
        )

        story.append(summary_table)
        story.append(Spacer(1, 8 * mm))

        # ---------------------------------------------------------
        # Transactions
        # ---------------------------------------------------------
        story.append(
            Paragraph(
                "Transaction Details",
                section_style,
            )
        )

        transaction_data = [
            [
                Paragraph("<b>Date</b>", small_style),
                Paragraph("<b>Transaction ID</b>", small_style),
                Paragraph("<b>Card</b>", small_style),
                Paragraph("<b>Amount</b>", small_style),
                Paragraph("<b>Status</b>", small_style),
            ]
        ]

        for transaction in transactions:
            card_number = "-"

            if transaction.card:
                card_number = (
                    transaction.card.masked_card_number
                )

            transaction_id = str(
                transaction.transaction_id
            )

            if len(transaction_id) > 12:
                transaction_id = (
                    transaction_id[:8] + "..."
                )

            transaction_data.append(
                [
                    Paragraph(
                        transaction.created_at.strftime(
                            "%d-%b-%Y"
                        ),
                        small_style,
                    ),
                    Paragraph(
                        transaction_id,
                        small_style,
                    ),
                    Paragraph(
                        card_number,
                        small_style,
                    ),
                    Paragraph(
                        f"₹{transaction.amount:,.2f}",
                        small_style,
                    ),
                    Paragraph(
                        transaction.status,
                        small_style,
                    ),
                ]
            )

        if not transactions:
            transaction_data.append(
                [
                    Paragraph(
                        "No transactions found for this month.",
                        small_style,
                    ),
                    "",
                    "",
                    "",
                    "",
                ]
            )

        transaction_table = Table(
            transaction_data,
            colWidths=[
                25 * mm,
                45 * mm,
                42 * mm,
                30 * mm,
                25 * mm,
            ],
            repeatRows=1,
        )

        transaction_table.setStyle(
            TableStyle(
                [
                    (
                        "BACKGROUND",
                        (0, 0),
                        (-1, 0),
                        colors.HexColor("#1f2937"),
                    ),
                    (
                        "TEXTCOLOR",
                        (0, 0),
                        (-1, 0),
                        colors.white,
                    ),
                    (
                        "GRID",
                        (0, 0),
                        (-1, -1),
                        0.35,
                        colors.lightgrey,
                    ),
                    (
                        "VALIGN",
                        (0, 0),
                        (-1, -1),
                        "MIDDLE",
                    ),
                    (
                        "LEFTPADDING",
                        (0, 0),
                        (-1, -1),
                        4,
                    ),
                    (
                        "RIGHTPADDING",
                        (0, 0),
                        (-1, -1),
                        4,
                    ),
                    (
                        "TOPPADDING",
                        (0, 0),
                        (-1, -1),
                        5,
                    ),
                    (
                        "BOTTOMPADDING",
                        (0, 0),
                        (-1, -1),
                        5,
                    ),
                ]
            )
        )

        story.append(transaction_table)
        story.append(Spacer(1, 8 * mm))

        # ---------------------------------------------------------
        # Footer note
        # ---------------------------------------------------------
        story.append(
            Paragraph(
                "This statement is generated electronically by "
                "CreditPay. Card numbers are masked for security. "
                "Please contact the administrator if you identify "
                "any incorrect transaction.",
                small_style,
            )
        )

        # ---------------------------------------------------------
        # Generate PDF
        # ---------------------------------------------------------
        document.build(story)

        return response