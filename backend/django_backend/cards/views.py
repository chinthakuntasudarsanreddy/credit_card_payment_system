from drf_spectacular.utils import extend_schema

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Card
from .serializers import (
    AddCardSerializer,
    CardSerializer,
)


class CardListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses=CardSerializer(many=True),
    )
    def get(self, request):
        cards = Card.objects.filter(
            user=request.user
        ).order_by("-created_at")

        serializer = CardSerializer(
            cards,
            many=True,
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    @extend_schema(
        request=AddCardSerializer,
        responses={201: CardSerializer},
    )
    def post(self, request):
        serializer = AddCardSerializer(
            data=request.data,
            context={
                "request": request,
            },
        )

        if serializer.is_valid():
            card = serializer.save()

            return Response(
                CardSerializer(card).data,
                status=status.HTTP_201_CREATED,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )


class CardDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_card(self, request, card_id):
        try:
            return Card.objects.get(
                id=card_id,
                user=request.user,
            )
        except Card.DoesNotExist:
            return None

    @extend_schema(
        responses=CardSerializer,
    )
    def get(self, request, card_id):
        card = self.get_card(
            request,
            card_id,
        )

        if card is None:
            return Response(
                {
                    "detail": "Card not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = CardSerializer(card)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    def delete(self, request, card_id):
        card = self.get_card(
            request,
            card_id,
        )

        if card is None:
            return Response(
                {
                    "detail": "Card not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        card.delete()

        return Response(
            {
                "message": "Card deleted successfully."
            },
            status=status.HTTP_200_OK,
        )