import type { AxiosInstance } from 'axios';

import { api } from '@/lib/api';
import { MediaCompressionError, prepareMediaForUpload } from '@/lib/media-compress';

export type MediaFolder = 'ads' | 'stores' | 'profiles' | 'chat' | 'banners' | 'hero' | 'tourism' | 'articles' | 'verification' | 'general';

export type MediaUploadResult = {
  key: string;
  url: string;
  provider: 'local' | 's3';
};

export type MediaUploadOptions = {
  onStageChange?: (stage: 'compressing' | 'uploading') => void;
  onCompressProgress?: (ratio: number) => void;
  client?: AxiosInstance;
};

export async function uploadMediaFile(
  file: File,
  folder: MediaFolder,
  options?: MediaUploadOptions
): Promise<MediaUploadResult> {
  options?.onStageChange?.('compressing');
  const preparedFile = await prepareMediaForUpload(file, {
    onCompressProgress: options?.onCompressProgress
  });

  options?.onStageChange?.('uploading');

  const formData = new FormData();
  formData.append('file', preparedFile);

  const client = options?.client ?? api;
  const response = await client.post<{ data: MediaUploadResult }>(`/media/upload?folder=${encodeURIComponent(folder)}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

  return response.data.data;
}

export { MediaCompressionError };
