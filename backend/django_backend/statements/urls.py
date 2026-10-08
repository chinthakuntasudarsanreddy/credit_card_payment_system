from django.urls import path

from .views import MonthlyStatementPDFView


urlpatterns = [
    path(
        "monthly/",
        MonthlyStatementPDFView.as_view(),
        name="monthly-statement",
    ),
]