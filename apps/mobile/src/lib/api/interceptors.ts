import type { InternalAxiosRequestConfig } from 'axios';

import type { AuthSession } from '../../types';
import { AUTH_PUBLIC_PATHS } from './endpoints';
import { http } from './client';

type AuthTokens = AuthSession['tokens'];

export type ApiInterceptorDeps = {
  getAccessToken: () => string | undefined;
  refreshTokens: () => Promise<AuthTokens>;
  clearSession: () => Promise<void>;
};

type RetryConfig = InternalAxiosRequestConfig & {
  _authRetry?: boolean;
};

let refreshPromise: Promise<AuthTokens> | undefined;
let deps: ApiInterceptorDeps | undefined;

const isPublicAuthRequest = (url?: string) => {
  if (!url) return false;
  return AUTH_PUBLIC_PATHS.some((path) => url.includes(path));
};

export function setupApiInterceptors(next: ApiInterceptorDeps) {
  if (deps) return;
  deps = next;

  http.interceptors.request.use((config) => {
    if (config.headers['X-Skip-Auth-Refresh']) {
      delete config.headers['X-Skip-Auth-Refresh'];
      return config;
    }

    const token = deps?.getAccessToken();
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  });

  http.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config as RetryConfig | undefined;

      if (
        error.response?.status !== 401 ||
        !originalRequest ||
        originalRequest._authRetry ||
        isPublicAuthRequest(originalRequest.url) ||
        !deps
      ) {
        throw error;
      }

      originalRequest._authRetry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = deps.refreshTokens().finally(() => {
            refreshPromise = undefined;
          });
        }
        const tokens = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
        return http(originalRequest);
      } catch {
        await deps.clearSession();
        throw error;
      }
    }
  );
}
