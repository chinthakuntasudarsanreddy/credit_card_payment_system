from django.urls import path

from .views import (
    TransactionCSVExportView,
    TransactionDetailView,
    TransactionListView,
)


urlpatterns = [
    path(
        "",
        TransactionListView.as_view(),
        name="transaction-list",
    ),
    path(
        "export/",
        TransactionCSVExportView.as_view(),
        name="transaction-export",
    ),
    path(
        "<str:transaction_id>/",
        TransactionDetailView.as_view(),
        name="transaction-detail",
    ),
]