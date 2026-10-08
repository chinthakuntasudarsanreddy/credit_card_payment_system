from django.urls import path

from .views import (
    InternalCardBlockedNotificationView,
    InternalLowCreditNotificationView,
    InternalTransactionNotificationView,
)

urlpatterns = [
    path(
        "internal/transaction/",
        InternalTransactionNotificationView.as_view(),
        name="internal-transaction-notification",
    ),
    path(
        "internal/low-credit/",
        InternalLowCreditNotificationView.as_view(),
        name="internal-low-credit-notification",
    ),
    path(
        "internal/card-blocked/",
        InternalCardBlockedNotificationView.as_view(),
        name="internal-card-blocked-notification",
    ),
]