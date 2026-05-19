import axios from 'axios';

import { getApiBaseUrl } from './api-base-url';
import { api } from './api';

const adminAuthClient = axios.create({
  withCredentials: true
});

adminAuthClient.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
  return config;
});

export const ADMIN_ACCESS_TOKEN_KEY = 'oman_sale_admin_access_token';
export const ADMIN_REFRESH_TOKEN_KEY = 'oman_sale_admin_refresh_token';
export const ADMIN_USER_KEY = 'oman_sale_admin_user';

export type AdminUser = {
  id: string;
  fullName: string;
  email: string;
  role: 'ADMIN' | 'MODERATOR';
  avatar?: string | null;
};

export type AdminLoginResponse = {
  user: AdminUser;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
};

export const getStoredAdminUser = () => {
  if (typeof window === 'undefined') return undefined;

  const rawUser = window.localStorage.getItem(ADMIN_USER_KEY);
  if (!rawUser) return undefined;

  try {
    return JSON.parse(rawUser) as AdminUser;
  } catch {
    return undefined;
  }
};

export const getAdminAccessToken = () => {
  if (typeof window === 'undefined') return undefined;
  return window.localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY) ?? undefined;
};

export const getAdminRefreshToken = () => {
  if (typeof window === 'undefined') return undefined;
  return window.localStorage.getItem(ADMIN_REFRESH_TOKEN_KEY) ?? undefined;
};

export const saveAdminSession = (session: AdminLoginResponse) => {
  window.localStorage.setItem(ADMIN_ACCESS_TOKEN_KEY, session.tokens.accessToken);
  window.localStorage.setItem(ADMIN_REFRESH_TOKEN_KEY, session.tokens.refreshToken);
  window.localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(session.user));
};

const saveAdminTokens = (tokens: AdminLoginResponse['tokens']) => {
  window.localStorage.setItem(ADMIN_ACCESS_TOKEN_KEY, tokens.accessToken);
  window.localStorage.setItem(ADMIN_REFRESH_TOKEN_KEY, tokens.refreshToken);
};

export const clearAdminSession = () => {
  window.localStorage.removeItem(ADMIN_ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(ADMIN_REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(ADMIN_USER_KEY);
};

let refreshPromise: Promise<AdminLoginResponse['tokens']> | undefined;

const getAdminLoginPath = () => {
  const pathLocale = window.location.pathname.split('/').filter(Boolean)[0];
  const storedLocale = window.localStorage.getItem('oman_sale_locale');
  const locale = pathLocale === 'en' || pathLocale === 'ar' ? pathLocale : storedLocale === 'en' ? 'en' : 'ar';
  return `/${locale}/admin/login`;
};

const redirectToAdminLogin = () => {
  clearAdminSession();
  window.location.assign(getAdminLoginPath());
};

const refreshAdminTokens = async () => {
  const refreshToken = getAdminRefreshToken();
  if (!refreshToken) throw new Error('Missing admin refresh token');

  if (!refreshPromise) {
    refreshPromise = adminAuthClient
      .post<{ data: AdminLoginResponse['tokens'] }>('/auth/refresh', { refreshToken })
      .then((response) => {
        saveAdminTokens(response.data.data);
        return response.data.data;
      })
      .finally(() => {
        refreshPromise = undefined;
      });
  }

  return refreshPromise;
};

export const adminApi = () => {
  const client = api.create();

  client.interceptors.request.use((config) => {
    config.baseURL = getApiBaseUrl();
    const token = getAdminAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config as typeof error.config & { _adminRetry?: boolean };

      if (error.response?.status !== 401 || originalRequest?._adminRetry) {
        throw error;
      }

      originalRequest._adminRetry = true;

      try {
        const tokens = await refreshAdminTokens();
        originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
        return client(originalRequest);
      } catch {
        redirectToAdminLogin();
        throw error;
      }
    }
  );

  return client;
};
