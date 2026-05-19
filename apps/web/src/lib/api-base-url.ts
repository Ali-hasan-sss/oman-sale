const API_PATH = '/api/v1';

const getApiPort = () => process.env.NEXT_PUBLIC_API_PORT ?? '4000';

let loggedDevApiUrl = false;

const getConfiguredApiUrl = () => process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, '');

/**
 * Direct backend URL (no Next.js proxy).
 * In development the browser always uses the same host as the page (LAN IP on phone, localhost on PC).
 */
export const getApiBaseUrl = () => {
  const port = getApiPort();

  if (typeof window !== 'undefined') {
    const { hostname, protocol } = window.location;

    if (process.env.NODE_ENV === 'development') {
      const url = `${protocol}//${hostname}:${port}${API_PATH}`;
      if (!loggedDevApiUrl) {
        loggedDevApiUrl = true;
        console.info('[Oman Sale] API base URL:', url);
      }
      return url;
    }

    const configured = getConfiguredApiUrl();
    if (configured && (/^https?:\/\//i.test(configured) || configured.startsWith('/'))) {
      return configured;
    }

    return `${protocol}//${hostname}:${port}${API_PATH}`;
  }

  const configured = getConfiguredApiUrl();
  if (configured && (/^https?:\/\//i.test(configured) || configured.startsWith('/'))) {
    return configured;
  }

  return `http://127.0.0.1:${port}${API_PATH}`;
};

export const getSocketBaseUrl = () => {
  const apiBaseUrl = getApiBaseUrl();
  const socketBaseUrl = apiBaseUrl.replace(/\/api\/v\d+\/?$/, '');
  if (socketBaseUrl) return socketBaseUrl;
  return typeof window !== 'undefined' ? window.location.origin : '';
};
