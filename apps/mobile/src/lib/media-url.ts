import { getApiBaseUrl } from './api';

export function resolveDeviceMediaUrl(reference: string | null | undefined) {
  if (!reference) return '';

  const apiBase = getApiBaseUrl().replace(/\/$/, '');
  if (reference.startsWith('media:')) {
    return `${apiBase}/media/files/${reference.slice('media:'.length)}`;
  }

  if (!/^https?:\/\//i.test(reference)) return reference;

  try {
    const remote = new URL(reference);
    const isLoopback =
      remote.hostname === 'localhost' || remote.hostname === '127.0.0.1' || remote.hostname === '0.0.0.0';
    if (!isLoopback) return reference;

    const api = new URL(apiBase);
    remote.protocol = api.protocol;
    remote.host = api.host;
    return remote.toString();
  } catch {
    return reference;
  }
}

export function isVideoMedia(item: { imageUrl: string; mediaType?: string | null }) {
  if (item.mediaType === 'VIDEO') return true;
  return /\.(mp4|webm|mov)(\?|#|$)/i.test(item.imageUrl);
}
