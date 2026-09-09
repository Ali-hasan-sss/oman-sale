import { http, type ApiEnvelope } from '../lib/api';

const allowedVerificationMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf'
]);
const maxVerificationFileSizeBytes = 8 * 1024 * 1024;

export type MediaUploadResult = {
  key: string;
  url?: string;
};

export async function uploadVerificationDocument(input: {
  uri: string;
  name: string;
  mimeType: string;
  size?: number | null;
}) {
  if (!allowedVerificationMimeTypes.has(input.mimeType)) {
    throw new Error('UNSUPPORTED_VERIFICATION_FILE');
  }

  if (input.size && input.size > maxVerificationFileSizeBytes) {
    throw new Error('VERIFICATION_FILE_TOO_LARGE');
  }

  const formData = new FormData();
  formData.append('file', {
    uri: input.uri,
    name: input.name,
    type: input.mimeType
  } as unknown as Blob);

  const response = await http.post<ApiEnvelope<MediaUploadResult>>('/media/upload?folder=verification', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000
  });

  return response.data.data;
}

const allowedAdImageMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const allowedAdVideoMimeTypes = new Set(['video/mp4', 'video/webm', 'video/quicktime']);
const maxAdFileSizeBytes = 12 * 1024 * 1024;

export async function uploadAdMedia(input: {
  uri: string;
  name: string;
  mimeType: string;
  size?: number | null;
  kind: 'image' | 'video';
}) {
  const allowed = input.kind === 'video' ? allowedAdVideoMimeTypes : allowedAdImageMimeTypes;
  if (!allowed.has(input.mimeType)) {
    throw new Error('UNSUPPORTED_AD_FILE');
  }

  if (input.size && input.size > maxAdFileSizeBytes) {
    throw new Error('AD_FILE_TOO_LARGE');
  }

  const formData = new FormData();
  formData.append('file', {
    uri: input.uri,
    name: input.name,
    type: input.mimeType
  } as unknown as Blob);

  const response = await http.post<ApiEnvelope<MediaUploadResult>>('/media/upload?folder=ads', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000
  });

  return response.data.data;
}
