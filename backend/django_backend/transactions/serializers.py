from rest_framework import serializers

from .models import Transaction


class TransactionCardSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    masked_card_number = serializers.CharField()
    last_four_digits = serializers.CharField()
    card_holder_name = serializers.CharField()
    card_type = serializers.CharField()
    status = serializers.CharField()
    credit_limit = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
    )


class TransactionSerializer(serializers.ModelSerializer):
    card = TransactionCardSerializer(read_only=True)

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