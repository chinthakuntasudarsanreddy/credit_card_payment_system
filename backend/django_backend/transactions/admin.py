from django.contrib import admin

from .models import Transaction


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = (
        "transaction_id",
        "user",
        "amount",
        "currency",
        "status",
        "card",
        "created_at",
    )

    list_filter = (
        "status",
        "currency",
        "created_at",
    )

    search_fields = (
        "transaction_id",
        "user__username",
        "user__email",
    )

    readonly_fields = (
        "transaction_id",
        "user",
        "card",
        "amount",
        "currency",
        "status",
        "payment_message",
        "created_at",
        "updated_at",
    )

    ordering = ("-created_at",)