import { getApiBaseUrl } from './client';

/** Socket.IO server URL (API origin without `/api/v1`). */
export function getSocketBaseUrl() {
  return getApiBaseUrl().replace(/\/api\/v\d+\/?$/, '');
}
