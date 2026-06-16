import { env } from '../../config/env';
import { ApiError } from '../../shared/utils/api-error';
import { getMediaKey, isMediaReference } from '../../shared/utils/media-reference';
import { getPublicMediaAccess, getPublicMediaBaseUrl } from '../../shared/utils/media-reference';
import { mediaStorage } from '../../shared/utils/media-storage';
import type { UploadMediaQuery } from './media.validation';

const allowedImageMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const allowedVideoMimeTypes = new Set(['video/mp4', 'video/webm', 'video/quicktime']);
const allowedDocumentMimeTypes = new Set(['application/pdf']);
const maxMediaSizeBytes = 10 * 1024 * 1024;
const maxDocumentSizeBytes = 8 * 1024 * 1024;
const objectKeyPattern = /^[a-z0-9][a-z0-9/_-]*\.[a-z0-9]+$/i;

export class MediaService {
  getPublicConfig() {
    return {
      publicBaseUrl: getPublicMediaBaseUrl(),
      access: getPublicMediaAccess()
    };
  }

  private normalizeObjectKey(input: string) {
    const trimmed = input.trim().replace(/^\/+/, '');
    const key = isMediaReference(trimmed) ? getMediaKey(trimmed) : trimmed;

    if (!key || key.includes('..') || !objectKeyPattern.test(key)) {
      throw new ApiError(400, 'Invalid media path');
    }

    const prefix = env.AWS_S3_PREFIX;
    if (!key.startsWith(`${prefix}/`)) {
      throw new ApiError(403, 'Forbidden media path');
    }

    return key;
  }

  async streamObject(rawKey: string) {
    const objectKey = this.normalizeObjectKey(rawKey);

    try {
      return await mediaStorage.read(objectKey);
    } catch {
      throw new ApiError(404, 'Media not found');
    }
  }

  async upload(file: Express.Multer.File | undefined, query: UploadMediaQuery) {
    if (!file) {
      throw new ApiError(400, 'File is required');
    }

    const isVideo = allowedVideoMimeTypes.has(file.mimetype);
    const isImage = allowedImageMimeTypes.has(file.mimetype);
    const isDocument = allowedDocumentMimeTypes.has(file.mimetype);
    const isVerificationUpload = query.folder === 'verification';

    if (!isVideo && !isImage && !(isVerificationUpload && isDocument)) {
      throw new ApiError(400, 'Unsupported file type');
    }

    const maxSize = isDocument ? maxDocumentSizeBytes : maxMediaSizeBytes;
    if (file.size > maxSize) {
      throw new ApiError(400, isVideo ? 'Video is too large' : isDocument ? 'Document is too large' : 'File is too large');
    }

    return mediaStorage.upload({
      buffer: file.buffer,
      fileName: file.originalname,
      contentType: file.mimetype,
      folder: query.folder
    });
  }
}

export const mediaService = new MediaService();
