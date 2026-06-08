import { z } from 'zod';

import { env } from '../../config/env';

export const MEDIA_REFERENCE_PREFIX = 'media:';

const mediaKeyPattern = /^[a-z0-9][a-z0-9/_-]*\.(jpe?g|png|webp|gif|mp4|webm|mov)$/i;

export function isMediaReference(value: string): boolean {
  return value.startsWith(MEDIA_REFERENCE_PREFIX);
}

export function getMediaKey(reference: string): string {
  return reference.slice(MEDIA_REFERENCE_PREFIX.length);
}

export function toMediaReference(key: string): string {
  return `${MEDIA_REFERENCE_PREFIX}${key}`;
}

export function isAllowedMediaReference(value: string, options?: { allowVideo?: boolean }) {
  const allowVideo = options?.allowVideo ?? true;

  if (isMediaReference(value)) {
    const key = getMediaKey(value);
    if (!mediaKeyPattern.test(key)) return false;
    if (!allowVideo && /\.(mp4|webm|mov)$/i.test(key)) return false;
    return true;
  }

  if (value.startsWith('data:image/')) {
    return value.length <= 1_500_000;
  }

  if (allowVideo && value.startsWith('data:video/')) {
    return value.length <= 60_000_000;
  }

  return /^https?:\/\//.test(value);
}

export function isAllowedImageReference(value: string): boolean {
  return isAllowedMediaReference(value, { allowVideo: false });
}

export const imageReferenceSchema = z
  .string()
  .max(2000)
  .refine((value) => isAllowedMediaReference(value, { allowVideo: false }), {
    message: 'Image must be a media reference, URL, or data image'
  });

export function isAllowedVideoReference(value: string): boolean {
  if (isMediaReference(value)) {
    return /\.(mp4|webm|mov)$/i.test(getMediaKey(value));
  }

  if (value.startsWith('data:video/')) {
    return value.length <= 60_000_000;
  }

  return /^https?:\/\//.test(value);
}

export const videoReferenceSchema = z
  .string()
  .max(2000)
  .refine(isAllowedVideoReference, { message: 'Video must be a media reference, URL, or data video' });

export function buildS3PublicBaseUrl(bucket: string, region: string): string {
  if (region === 'us-east-1') {
    return `https://${bucket}.s3.amazonaws.com`;
  }

  return `https://${bucket}.s3.${region}.amazonaws.com`;
}

export function getMediaFilesProxyBaseUrl(): string {
  return `${env.API_URL.replace(/\/$/, '')}/api/v1/media/files`;
}

export function getPublicMediaAccess(): 'private' | 'public' | 'local' {
  if (env.MEDIA_PROVIDER === 'local') return 'local';
  if (env.MEDIA_S3_ACCESS === 'public') return 'public';
  return 'private';
}

export function getPublicMediaBaseUrl(): string | null {
  if (env.MEDIA_PROVIDER === 's3' && env.MEDIA_S3_ACCESS === 'private') {
    return getMediaFilesProxyBaseUrl();
  }

  const configuredBase = env.MEDIA_PUBLIC_BASE_URL?.replace(/\/$/, '');
  if (configuredBase) return configuredBase;

  if (env.MEDIA_PROVIDER === 's3' && env.AWS_S3_BUCKET && env.AWS_REGION) {
    return buildS3PublicBaseUrl(env.AWS_S3_BUCKET, env.AWS_REGION);
  }

  if (env.MEDIA_PROVIDER === 'local') {
    return getMediaFilesProxyBaseUrl();
  }

  return null;
}

export function resolveMediaUrl(value: string | null | undefined): string {
  if (!value) return '';

  if (!isMediaReference(value)) {
    return rewriteLegacyUploadsUrl(value);
  }

  const base = getPublicMediaBaseUrl();
  if (!base) return value;

  return `${base}/${getMediaKey(value)}`;
}

function rewriteLegacyUploadsUrl(value: string): string {
  const uploadsMatch = value.match(/\/uploads\/(.+)$/);
  if (!uploadsMatch) return value;

  const objectKey = uploadsMatch[1];
  if (!objectKey || objectKey.includes('..')) return value;

  return `${getMediaFilesProxyBaseUrl()}/${objectKey}`;
}
