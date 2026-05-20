import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

import { getApiBaseUrl, http } from './client';

const LOG_PREFIX = '[API]';

const SENSITIVE_KEYS = new Set(['password', 'currentPassword', 'newPassword', 'refreshToken', 'accessToken', 'code']);

function isApiDebugEnabled() {
  if (typeof __DEV__ !== 'undefined' && !__DEV__) return false;
  const flag = process.env.EXPO_PUBLIC_API_DEBUG?.trim().toLowerCase();
  if (flag === '0' || flag === 'false') return false;
  return true;
}

function redactValue(key: string, value: unknown): unknown {
  if (SENSITIVE_KEYS.has(key)) return '***';
  return value;
}

function sanitize(data: unknown): unknown {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map((item) => sanitize(item));

  return Object.fromEntries(
    Object.entries(data as Record<string, unknown>).map(([key, value]) => [
      key,
      typeof value === 'object' && value !== null ? sanitize(value) : redactValue(key, value)
    ])
  );
}

function fullUrl(config: InternalAxiosRequestConfig) {
  const base = (config.baseURL ?? '').replace(/\/$/, '');
  const path = config.url ?? '';
  if (path.startsWith('http')) return path;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

function preview(data: unknown, max = 1200) {
  try {
    const text = JSON.stringify(sanitize(data), null, 2);
    return text.length > max ? `${text.slice(0, max)}…` : text;
  } catch {
    return String(data);
  }
}

let loggingInstalled = false;

export function setupApiLogging() {
  if (loggingInstalled || !isApiDebugEnabled()) return;
  loggingInstalled = true;

  console.log(`${LOG_PREFIX} baseURL → ${getApiBaseUrl()}`);

  http.interceptors.request.use((config) => {
    const method = (config.method ?? 'GET').toUpperCase();
    const url = fullUrl(config);
    const payload =
      config.data !== undefined
        ? preview(typeof config.data === 'string' ? tryParseJson(config.data) : config.data, 800)
        : undefined;

    console.log(`${LOG_PREFIX} → ${method} ${url}`);
    if (config.params) console.log(`${LOG_PREFIX}   params:`, sanitize(config.params));
    if (payload !== undefined) console.log(`${LOG_PREFIX}   body:`, payload);

    return config;
  });

  http.interceptors.response.use(
    (response: AxiosResponse) => {
      const method = (response.config.method ?? 'GET').toUpperCase();
      const url = fullUrl(response.config);
      console.log(`${LOG_PREFIX} ← ${response.status} ${method} ${url}`);
      console.log(`${LOG_PREFIX}   data:`, preview(response.data));
      return response;
    },
    (error: AxiosError<{ message?: string }>) => {
      const config = error.config;
      const method = (config?.method ?? 'GET').toUpperCase();
      const url = config ? fullUrl(config) : 'unknown';
      const status = error.response?.status ?? 'NETWORK';
      const message = error.response?.data?.message ?? error.message;

      console.warn(`${LOG_PREFIX} ✕ ${status} ${method} ${url}`);
      console.warn(`${LOG_PREFIX}   message:`, message);
      if (error.response?.data) console.warn(`${LOG_PREFIX}   data:`, preview(error.response.data));

      if (!error.response) {
        console.warn(`${LOG_PREFIX}   hint: تحقق من EXPO_PUBLIC_API_URL والاتصال بالشبكة/السيرفر`);
      }

      throw error;
    }
  );
}

function tryParseJson(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}
