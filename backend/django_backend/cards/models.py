from django.conf import settings
from django.db import models


class Card(models.Model):
    CARD_TYPE_CHOICES = (
        ("credit", "Credit"),
        ("debit", "Debit"),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="cards",
    )

    card_holder_name = models.CharField(
        max_length=100,
    )

    masked_card_number = models.CharField(
        max_length=19,
    )

    last_four_digits = models.CharField(
        max_length=4,
    )

    expiry_month = models.PositiveSmallIntegerField()

    expiry_year = models.PositiveSmallIntegerField()

    card_type = models.CharField(
        max_length=10,
        choices=CARD_TYPE_CHOICES,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    def __str__(self):
        return (
            f"{self.card_type.title()} Card "
            f"**** **** **** {self.last_four_digits}"
        )