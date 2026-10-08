
from django.urls import path

from .views import (
    CardDetailView,
    CardListCreateView,
    CardStatusView,
)

from .admin_views import (
    AdminCardDetailView,
    AdminCardListView,
)


urlpatterns = [
    # ============================================================
    # ADMIN CARD MANAGEMENT
    # ============================================================

    path(
        "admin/",
        AdminCardListView.as_view(),
        name="admin-card-list",
    ),

    path(
        "admin/<int:card_id>/",
        AdminCardDetailView.as_view(),
        name="admin-card-detail",
    ),

    # ============================================================
    # CUSTOMER CARD MANAGEMENT
    # ============================================================

    path(
        "",
        CardListCreateView.as_view(),
        name="card-list-create",
    ),

    path(
        "<int:card_id>/",
        CardDetailView.as_view(),
        name="card-detail",
    ),

    path(
        "<int:card_id>/status/",
        CardStatusView.as_view(),
        name="card-status",
    ),
]
