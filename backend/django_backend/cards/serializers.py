from rest_framework import serializers

from .models import Card


class CardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Card
        fields = (
            "id",
            "card_holder_name",
            "masked_card_number",
            "last_four_digits",
            "expiry_month",
            "expiry_year",
            "card_type",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "masked_card_number",
            "last_four_digits",
            "created_at",
            "updated_at",
        )


class AddCardSerializer(serializers.Serializer):
    card_holder_name = serializers.CharField(
        max_length=100,
    )

    card_number = serializers.CharField(
        min_length=13,
        max_length=19,
        write_only=True,
    )

    expiry_month = serializers.IntegerField(
        min_value=1,
        max_value=12,
    )

    expiry_year = serializers.IntegerField(
        min_value=2026,
        max_value=2100,
    )

    card_type = serializers.ChoiceField(
        choices=("credit", "debit"),
    )

    def validate_card_number(self, value):
        value = value.replace(" ", "").replace("-", "")

        if not value.isdigit():
            raise serializers.ValidationError(
                "Card number must contain only digits."
            )

        if not 13 <= len(value) <= 19:
            raise serializers.ValidationError(
                "Card number must contain 13 to 19 digits."
            )

        return value

    def validate(self, attrs):
        card_number = attrs["card_number"]

        attrs["masked_card_number"] = (
            "**** **** **** "
            + card_number[-4:]
        )

        attrs["last_four_digits"] = card_number[-4:]

        return attrs

    def create(self, validated_data):
        validated_data.pop("card_number")

        return Card.objects.create(
            user=self.context["request"].user,
            card_holder_name=validated_data[
                "card_holder_name"
            ],
            masked_card_number=validated_data[
                "masked_card_number"
            ],
            last_four_digits=validated_data[
                "last_four_digits"
            ],
            expiry_month=validated_data[
                "expiry_month"
            ],
            expiry_year=validated_data[
                "expiry_year"
            ],
            card_type=validated_data[
                "card_type"
            ],
        )