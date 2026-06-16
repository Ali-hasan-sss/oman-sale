import axios, { type AxiosInstance } from 'axios';

import { ApiErrorCodes, getApiErrorCode } from './api-errors';
import { getApiBaseUrl } from './api-base-url';
import { getDeviceId } from './device-id';
import { clearUserSession, getUserAccessToken, getUserRefreshToken, saveUserTokens, type UserAuthSession } from './user-auth';
import { useAuthStore } from '@/store/auth-store';

export const api = axios.create({
  withCredentials: true
});

const attachDynamicBaseUrl = (client: AxiosInstance) => {
  client.interceptors.request.use((config) => {
    config.baseURL = getApiBaseUrl();
    return config;
  });
};

attachDynamicBaseUrl(api);

type UserAuthRequestConfig = typeof api.defaults & {
  _userRetry?: boolean;
  _skipUserAuth?: boolean;
};

type UserTokens = UserAuthSession['tokens'];

let refreshPromise: Promise<UserTokens> | undefined;

const authPassthroughPaths = ['/auth/login', '/auth/register', '/auth/google', '/auth/admin/login', '/auth/refresh'];

const isAuthPassthroughRequest = (url?: string) => {
  if (!url) return false;
  return authPassthroughPaths.some((path) => url.includes(path));
};

const getUserLocalePath = (suffix: string) => {
  const pathLocale = window.location.pathname.split('/').filter(Boolean)[0];
  const storedLocale = window.localStorage.getItem('oman_sale_locale');
  const locale = pathLocale === 'en' || pathLocale === 'ar' ? pathLocale : storedLocale === 'en' ? 'en' : 'ar';
  return `/${locale}${suffix}`;
};

const getUserLoginPath = () => getUserLocalePath('/login');

const getCompleteProfilePath = () => getUserLocalePath('/complete-profile');

const isOnCompleteProfilePage = () => {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.replace(/^\/(ar|en)(?=\/|$)/, '') || '/';
  return path === '/complete-profile' || path.startsWith('/complete-profile/');
};

const redirectToUserLogin = () => {
  clearUserSession();
  window.location.assign(getUserLoginPath());
};

const refreshUserTokens = async () => {
  const refreshToken = getUserRefreshToken();
  if (!refreshToken) throw new Error('Missing user refresh token');

  if (!refreshPromise) {
    refreshPromise = axios
      .post<{ data: UserTokens }>(`${getApiBaseUrl()}/auth/refresh`, { refreshToken }, { withCredentials: true })
      .then((response) => {
        saveUserTokens(response.data.data);
        return response.data.data;
      })
      .finally(() => {
        refreshPromise = undefined;
      });
  }

  return refreshPromise;
};

api.interceptors.request.use((config) => {
  const userConfig = config as typeof config & { _skipUserAuth?: boolean };
  if (userConfig._skipUserAuth) return config;

  const token = getUserAccessToken();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const deviceId = getDeviceId();
  if (deviceId) {
    config.headers['X-Device-Id'] = deviceId;
    config.headers['X-Client-Source'] = 'web';
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as typeof error.config & UserAuthRequestConfig;
    const errorCode = getApiErrorCode(error);

    if (error.response?.status === 403) {
      if (errorCode === ApiErrorCodes.ACCOUNT_BLOCKED) {
        useAuthStore.getState().markAccountRestricted('blocked');
      } else if (errorCode === ApiErrorCodes.ACCOUNT_INACTIVE) {
        useAuthStore.getState().markAccountRestricted('inactive');
      } else if (errorCode === ApiErrorCodes.PROFILE_INCOMPLETE) {
        if (!isOnCompleteProfilePage()) {
          window.location.assign(getCompleteProfilePath());
        }
        throw error;
      }
    }

    if (
      error.response?.status !== 401 ||
      originalRequest?._userRetry ||
      originalRequest?._skipUserAuth ||
      isAuthPassthroughRequest(originalRequest?.url)
    ) {
      throw error;
    }

    originalRequest._userRetry = true;

    try {
      const tokens = await refreshUserTokens();
      originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
      return api(originalRequest);
    } catch {
      redirectToUserLogin();
      throw error;
    }
  }
);
