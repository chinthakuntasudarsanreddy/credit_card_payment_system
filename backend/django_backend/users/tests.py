from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from users.models import User


class UserAPITestCase(APITestCase):

    def setUp(self):
        self.register_url = "/api/users/register/"
        self.login_url = "/api/users/login/"
        self.profile_url = "/api/users/profile/"

        self.user_data = {
            "username": "testuser",
            "email": "testuser@example.com",
            "password": "StrongPassword@123",
            "phone_number": "9876543210",
        }

    def test_user_registration(self):
        response = self.client.post(
            self.register_url,
            self.user_data,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        self.assertTrue(
            User.objects.filter(
                username="testuser"
            ).exists()
        )

    def test_user_login(self):
        User.objects.create_user(
            username="testuser",
            email="testuser@example.com",
            password="StrongPassword@123",
            phone_number="9876543210",
        )

        response = self.client.post(
            self.login_url,
            {
                "username": "testuser",
                "password": "StrongPassword@123",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_invalid_login(self):
        User.objects.create_user(
            username="testuser",
            email="testuser@example.com",
            password="StrongPassword@123",
        )

        response = self.client.post(
            self.login_url,
            {
                "username": "testuser",
                "password": "WrongPassword@123",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_profile_requires_authentication(self):
        response = self.client.get(
            self.profile_url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_authenticated_profile(self):
        user = User.objects.create_user(
            username="testuser",
            email="testuser@example.com",
            password="StrongPassword@123",
        )

        self.client.force_authenticate(
            user=user
        )

        response = self.client.get(
            self.profile_url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["username"],
            "testuser",
        )