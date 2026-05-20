import axios from 'axios';

const defaultApiUrl = 'https://omansale.om/api/v1';

export const getApiBaseUrl = () => process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/$/, '') || defaultApiUrl;

/** Bare Axios instance — interceptors are registered once via `setupApiInterceptors`. */
export const http = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 12000,
  headers: {
    'X-Client-Source': 'mobile'
  }
});
