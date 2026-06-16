import type { AxiosInstance } from 'axios';

import { api } from '@/lib/api';
import type { MediaUploadResult } from '@/lib/media-upload';

const allowedVerificationMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']);
const maxVerificationFileSizeBytes = 8 * 1024 * 1024;

export async function uploadVerificationDocument(
  file: File,
  options?: { client?: AxiosInstance }
): Promise<MediaUploadResult> {
  if (!allowedVerificationMimeTypes.has(file.type)) {
    throw new Error('UNSUPPORTED_VERIFICATION_FILE');
  }

  if (file.size > maxVerificationFileSizeBytes) {
    throw new Error('VERIFICATION_FILE_TOO_LARGE');
  }

  const formData = new FormData();
  formData.append('file', file);

  const client = options?.client ?? api;
  const response = await client.post<{ data: MediaUploadResult }>(
    '/media/upload?folder=verification',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );

  return response.data.data;
}
