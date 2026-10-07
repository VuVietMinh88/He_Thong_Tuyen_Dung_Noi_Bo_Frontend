import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const clearAuthState = (): void => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_role');
};

const redirectToLogin = (): void => {
  clearAuthState();
  window.location.assign('/login');
};

const redirectToUnauthorized = (): void => {
  window.location.assign('/unauthorized');
};

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    const status = error.response?.status;

    if (status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');

        if (!refreshToken) {
          redirectToLogin();
          return Promise.reject(error);
        }

        const refreshResponse = await refreshClient.post('/auth/refresh', {
          refreshToken,
        });

        const newAccessToken = refreshResponse.data?.accessToken ?? refreshResponse.data?.token;
        const newRefreshToken =
          refreshResponse.data?.refreshToken ?? refreshResponse.data?.refresh_token;

        if (!newAccessToken) {
          redirectToLogin();
          return Promise.reject(error);
        }

        localStorage.setItem('access_token', newAccessToken);

        if (newRefreshToken) {
          localStorage.setItem('refresh_token', newRefreshToken);
        }

        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return axiosClient(originalRequest);
      } catch (refreshError) {
        redirectToLogin();
        return Promise.reject(refreshError);
      }
    }

    if (status === 403) {
      redirectToUnauthorized();
      return Promise.reject(error);
    }

    return Promise.reject(error);
  },
);

export default axiosClient;
