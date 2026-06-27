import type { AxiosInstance } from 'axios';

import { adminApi, getAdminAccessToken } from './admin-auth';
import { api } from './api';
import { getUserAccessToken } from './user-auth';

export const getNotificationAccessToken = () => getUserAccessToken() ?? getAdminAccessToken();

export const hasNotificationSession = () => Boolean(getNotificationAccessToken());

export const getNotificationApiClient = (): AxiosInstance | undefined => {
  if (getUserAccessToken()) return api;
  if (getAdminAccessToken()) return adminApi();
  return undefined;
};
