from django.contrib import admin
from django.urls import include, path

from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
)


urlpatterns = [
    path(
        "admin/",
        admin.site.urls,
    ),

    # API
    path(
        "api/users/",
        include("users.urls"),
    ),

    path(
        "api/cards/",
        include("cards.urls"),
    ),

    path(
        "api/transactions/",
        include("transactions.urls"),
    ),

    path(
        "api/admin-logs/",
        include("admin_logs.urls"),
    ),

    # OpenAPI schema
    path(
        "api/schema/",
        SpectacularAPIView.as_view(),
        name="schema",
    ),

    # Swagger UI
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(
            url_name="schema"
        ),
        name="swagger-ui",
    ),
]