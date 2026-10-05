from rest_framework import status
from rest_framework.test import APITestCase

from users.models import User
from cards.models import Card


class CardAPITestCase(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="carduser",
            email="carduser@example.com",
            password="StrongPassword@123",
        )

        self.url = "/api/cards/"

        self.client.force_authenticate(
            user=self.user
        )

    def test_add_card(self):
        response = self.client.post(
            self.url,
            {
                "card_holder_name": "Test User",
                "card_number": "4111111111111111",
                "expiry_month": 12,
                "expiry_year": 2030,
                "card_type": "credit",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        self.assertEqual(
            Card.objects.count(),
            1,
        )

        card = Card.objects.first()

        self.assertEqual(
            card.last_four_digits,
            "1111",
        )

        self.assertEqual(
            card.masked_card_number,
            "**** **** **** 1111",
        )

        self.assertNotIn(
            "4111111111111111",
            card.masked_card_number,
        )

    def test_card_list(self):
        Card.objects.create(
            user=self.user,
            card_holder_name="Test User",
            masked_card_number="**** **** **** 1111",
            last_four_digits="1111",
            expiry_month=12,
            expiry_year=2030,
            card_type="credit",
        )

        response = self.client.get(
            self.url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            len(response.data),
            1,
        )

    def test_delete_card(self):
        card = Card.objects.create(
            user=self.user,
            card_holder_name="Test User",
            masked_card_number="**** **** **** 1111",
            last_four_digits="1111",
            expiry_month=12,
            expiry_year=2030,
            card_type="credit",
        )

        response = self.client.delete(
            f"/api/cards/{card.id}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertFalse(
            Card.objects.filter(
                id=card.id
            ).exists()
        )

    def test_card_requires_authentication(self):
        self.client.force_authenticate(
            user=None
        )

        response = self.client.get(
            self.url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )