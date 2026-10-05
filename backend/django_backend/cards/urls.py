from django.urls import path

from .views import (
    CardDetailView,
    CardListCreateView,
)

urlpatterns = [
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
]