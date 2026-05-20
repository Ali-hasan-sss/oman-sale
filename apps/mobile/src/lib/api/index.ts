export { http, getApiBaseUrl } from './client';
export { API_ENDPOINTS, AUTH_PUBLIC_PATHS } from './endpoints';
export { setupApiLogging } from './logger';
export { setupApiInterceptors, type ApiInterceptorDeps } from './interceptors';
export type { ApiEnvelope, ApiListPage, PagedResult } from './types';

/** @deprecated Use `http` from this module. Kept for gradual migration. */
export { http as api } from './client';
