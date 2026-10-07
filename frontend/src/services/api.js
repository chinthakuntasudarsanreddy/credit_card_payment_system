import axios from "axios";

const API_URL = "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ============================================================
// REQUEST INTERCEPTOR
// ============================================================

api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("access_token");

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================================
// RESPONSE INTERCEPTOR
// Automatically refresh expired access token
// ============================================================

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    // Only handle Django 401 responses once
    if (
      error.response?.status !== 401 ||
      originalRequest?._retry
    ) {
      return Promise.reject(error);
    }

    // Never refresh the login or refresh endpoint itself
    if (
      originalRequest.url?.includes("/api/users/login/") ||
      originalRequest.url?.includes("/api/users/token/refresh/")
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const refreshToken =
      localStorage.getItem("refresh_token");

    // No refresh token -> force login
    if (!refreshToken) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");

      window.location.href = "/login";

      return Promise.reject(error);
    }

    try {
      const refreshResponse = await axios.post(
        `${API_URL}/api/users/token/refresh/`,
        {
          refresh: refreshToken,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const newAccessToken =
        refreshResponse.data.access;

      if (!newAccessToken) {
        throw new Error(
          "Django did not return a new access token."
        );
      }

      // Save new access token
      localStorage.setItem(
        "access_token",
        newAccessToken
      );

      // Retry original request with new token
      originalRequest.headers = {
        ...originalRequest.headers,
        Authorization: `Bearer ${newAccessToken}`,
      };

      return api(originalRequest);

    } catch (refreshError) {
      console.error(
        "JWT refresh failed:",
        refreshError.response?.data ||
          refreshError.message
      );

      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");

      window.location.href = "/login";

      return Promise.reject(refreshError);
    }
  }
);

export default api;