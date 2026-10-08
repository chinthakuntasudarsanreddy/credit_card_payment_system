from decimal import Decimal

from django.conf import settings
from django.core.mail import send_mail


def send_transaction_amount_alert(transaction):
    """
    Send an email when a transaction amount exceeds ₹5000.
    """

    user = transaction.user

    if not user.email:
        return False

    subject = "Credit Card Alert - High Value Transaction"

    message = (
        f"Hello {user.first_name or user.username},\n\n"
        f"A high-value transaction has been detected on your account.\n\n"
        f"Transaction ID: {transaction.transaction_id}\n"
        f"Amount: {transaction.amount} {transaction.currency}\n"
        f"Status: {transaction.status}\n"
        f"Card: "
        f"{transaction.card.masked_card_number if transaction.card else 'N/A'}\n"
        f"Date: {transaction.created_at}\n\n"
        "This transaction exceeds the ₹5000 notification threshold.\n\n"
        "If you did not make this transaction, please contact "
        "your bank or administrator immediately.\n\n"
        "Regards,\n"
        "Credit Card Payment System"
    )

    send_mail(
        subject=subject,
        message=message,
        from_email=getattr(
            settings,
            "DEFAULT_FROM_EMAIL",
            None,
        ),
        recipient_list=[user.email],
        fail_silently=False,
    )

    return True


def send_card_blocked_alert(card):
    """
    Send an email when a card is blocked.
    """

    user = card.user

    if not user.email:
        return False

    subject = "Credit Card Alert - Card Blocked"

    message = (
        f"Hello {user.first_name or user.username},\n\n"
        "Your credit/debit card has been blocked.\n\n"
        f"Card: {card.masked_card_number}\n"
        f"Card Type: {card.card_type.title()}\n\n"
        "If you did not request this action, please contact "
        "your administrator immediately.\n\n"
        "Regards,\n"
        "Credit Card Payment System"
    )

    send_mail(
        subject=subject,
        message=message,
        from_email=getattr(
            settings,
            "DEFAULT_FROM_EMAIL",
            None,
        ),
        recipient_list=[user.email],
        fail_silently=False,
    )

    return True


def send_low_credit_limit_alert(
    card,
    available_credit_limit,
    credit_limit,
):
    """
    Send an email when available credit falls below 10%.
    """

    user = card.user

    if not user.email:
        return False

    if credit_limit <= Decimal("0"):
        return False

    percentage = (
        available_credit_limit / credit_limit
    ) * Decimal("100")

    subject = "Credit Card Alert - Low Available Credit"

    message = (
        f"Hello {user.first_name or user.username},\n\n"
        "Your available credit limit has fallen below 10%.\n\n"
        f"Card: {card.masked_card_number}\n"
        f"Credit Limit: ₹{credit_limit}\n"
        f"Available Credit: ₹{available_credit_limit}\n"
        f"Available Percentage: {percentage:.2f}%\n\n"
        "Please consider making a payment to increase "
        "your available credit.\n\n"
        "Regards,\n"
        "Credit Card Payment System"
    )

    send_mail(
        subject=subject,
        message=message,
        from_email=getattr(
            settings,
            "DEFAULT_FROM_EMAIL",
            None,
        ),
        recipient_list=[user.email],
        fail_silently=False,
    )

    return True
