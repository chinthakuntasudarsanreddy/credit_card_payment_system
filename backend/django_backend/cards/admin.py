from django.contrib import admin

from .models import Card


@admin.register(Card)
class CardAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "card_holder_name",
        "masked_card_number",
        "last_four_digits",
        "card_type",
        "expiry_month",
        "expiry_year",
        "created_at",
    )

    list_filter = (
        "card_type",
        "created_at",
    )

    search_fields = (
        "card_holder_name",
        "user__username",
        "user__email",
        "last_four_digits",
    )

    readonly_fields = (
        "user",
        "card_holder_name",
        "masked_card_number",
        "last_four_digits",
        "expiry_month",
        "expiry_year",
        "card_type",
        "created_at",
        "updated_at",
    )

    ordering = ("-created_at",)
    