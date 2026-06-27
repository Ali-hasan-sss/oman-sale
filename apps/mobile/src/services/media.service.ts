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
