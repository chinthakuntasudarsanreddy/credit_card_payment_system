from rest_framework import serializers

from .models import Transaction


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = (
            "id",
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
        read_only_fields = fields