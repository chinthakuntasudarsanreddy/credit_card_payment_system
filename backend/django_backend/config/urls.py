from django.contrib import admin
from django.urls import include, path

from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
)


urlpatterns = [
    # ========================================================
    # Django Admin
    # ========================================================
    path(
        "admin/",
        admin.site.urls,
    ),

    # ========================================================
    # API - Users
    # ========================================================
    path(
        "api/users/",
        include("users.urls"),
    ),

    # ========================================================
    # API - Cards
    # ========================================================
    path(
        "api/cards/",
        include("cards.urls"),
    ),

    # ========================================================
    # API - Transactions
    # ========================================================
    path(
        "api/transactions/",
        include("transactions.urls"),
    ),

    # ========================================================
    # API - Admin Logs
    # ========================================================
    path(
        "api/admin-logs/",
        include("admin_logs.urls"),
    ),

    # ========================================================
    # Internal Notification API
    # ========================================================
    path(
        "api/notifications/",
        include("notifications.urls"),
    ),

    # ========================================================
    # Monthly Statements
    # ========================================================
    path(
        "api/statements/",
        include("statements.urls"),
    ),

    # ========================================================
    # OpenAPI Schema
    # ========================================================
    path(
        "api/schema/",
        SpectacularAPIView.as_view(),
        name="schema",
    ),

    # ========================================================
    # Swagger UI
    # ========================================================
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(
            url_name="schema",
        ),
        name="swagger-ui",
    ),
]