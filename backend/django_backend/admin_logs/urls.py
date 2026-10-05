from django.urls import path

from .views import DailyPaymentSummaryView


urlpatterns = [
    path(
        "daily-summary/",
        DailyPaymentSummaryView.as_view(),
        name="daily-payment-summary",
    ),
]