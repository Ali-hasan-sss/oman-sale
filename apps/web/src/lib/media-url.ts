const MEDIA_REFERENCE_PREFIX = 'media:';

let runtimeMediaBaseUrl: string | null = null;
const previewUrlByReference = new Map<string, string>();

export function isMediaReference(value: string): boolean {
  return value.startsWith(MEDIA_REFERENCE_PREFIX);
}

export function setMediaBaseUrl(url: string | null | undefined) {
  runtimeMediaBaseUrl = url?.replace(/\/$/, '') || null;
}

export function registerMediaPreviewUrl(reference: string, url: string) {
  if (!reference || !url) return;
  previewUrlByReference.set(reference, url);
}

export function resolveMediaUrl(value: string | null | undefined): string {
  if (!value) return '';

  if (!isMediaReference(value)) {
    return rewriteLegacyUploadsUrl(value);
  }

  const cachedPreview = previewUrlByReference.get(value);
  if (cachedPreview) return cachedPreview;

  const key = value.slice(MEDIA_REFERENCE_PREFIX.length);
  const base = runtimeMediaBaseUrl ?? process.env.NEXT_PUBLIC_MEDIA_BASE_URL?.replace(/\/$/, '');

  if (!base) {
    return value;
  }

  return `${base}/${key}`;
}

function rewriteLegacyUploadsUrl(value: string): string {
  try {
    const url = new URL(value, typeof window !== 'undefined' ? window.location.origin : undefined);
    const uploadsMatch = url.pathname.match(/^\/uploads\/(.+)$/);
    if (!uploadsMatch) return value;

    const apiBase = typeof window !== 'undefined' ? '/api/v1' : process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? '/api/v1';
    return `${apiBase}/media/files/${uploadsMatch[1]}`;
  } catch {
    return value;
  }
}
