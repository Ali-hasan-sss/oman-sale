import { randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';

import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import type { Readable } from 'node:stream';

import { env } from '../../config/env';
import { getMediaKey, resolveMediaUrl, toMediaReference } from './media-reference';

export type MediaFolder = 'ads' | 'stores' | 'profiles' | 'chat' | 'banners' | 'hero' | 'tourism' | 'articles' | 'categories' | 'general' | 'verification';

export type UploadInput = {
  buffer: Buffer;
  fileName: string;
  contentType: string;
  folder: MediaFolder;
};

export type UploadResult = {
  key: string;
  url: string;
  provider: 'local' | 's3';
};

export type MediaObjectStream = {
  stream: Readable;
  contentType: string;
  cacheControl?: string;
};

export interface MediaStorage {
  upload(input: UploadInput): Promise<UploadResult>;
  read(objectKey: string): Promise<MediaObjectStream>;
  delete(reference: string): Promise<void>;
}

const extensionByMime: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
  'application/pdf': 'pdf'
};

function resolveExtension(fileName: string, contentType: string) {
  const fromMime = extensionByMime[contentType];
  if (fromMime) return fromMime;

  const fromName = path.extname(fileName).replace(/^\./, '').toLowerCase();
  if (fromName) return fromName;

  return 'bin';
}

function buildObjectKey(folder: MediaFolder, fileName: string, contentType: string) {
  const year = new Date().getFullYear().toString();
  const extension = resolveExtension(fileName, contentType);
  const segments = [env.AWS_S3_PREFIX, folder, year, `${randomUUID()}.${extension}`].filter(Boolean);
  return segments.join('/');
}

const localUploadsRoot = path.resolve(process.cwd(), 'uploads');

export class LocalMediaStorage implements MediaStorage {
  async upload(input: UploadInput): Promise<UploadResult> {
    const objectKey = buildObjectKey(input.folder, input.fileName, input.contentType);
    const diskPath = path.join(localUploadsRoot, objectKey);
    await fs.mkdir(path.dirname(diskPath), { recursive: true });
    await fs.writeFile(diskPath, input.buffer);

    const reference = toMediaReference(objectKey);

    return {
      key: reference,
      url: resolveMediaUrl(reference),
      provider: 'local'
    };
  }

  async read(objectKey: string): Promise<MediaObjectStream> {
    const diskPath = path.join(localUploadsRoot, objectKey);
    const stream = createReadStream(diskPath);
    const extension = path.extname(objectKey).replace(/^\./, '').toLowerCase();
    const contentType =
      extension === 'png'
        ? 'image/png'
        : extension === 'webp'
          ? 'image/webp'
          : extension === 'gif'
            ? 'image/gif'
            : extension === 'mp4'
              ? 'video/mp4'
              : extension === 'webm'
                ? 'video/webm'
                : extension === 'mov'
                  ? 'video/quicktime'
                  : 'image/jpeg';

    return {
      stream,
      contentType,
      cacheControl: 'public, max-age=31536000, immutable'
    };
  }

  async delete(reference: string): Promise<void> {
    const objectKey = getMediaKey(reference);
    const diskPath = path.join(localUploadsRoot, objectKey);
    await fs.rm(diskPath, { force: true });
  }
}

export class S3MediaStorage implements MediaStorage {
  private client: S3Client;

  constructor() {
    if (!env.AWS_REGION || !env.AWS_S3_BUCKET || !env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY) {
      throw new Error('S3 media provider requires AWS_REGION, AWS_S3_BUCKET, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY');
    }

    this.client = new S3Client({
      region: env.AWS_REGION,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY
      }
    });
  }

  async upload(input: UploadInput): Promise<UploadResult> {
    const objectKey = buildObjectKey(input.folder, input.fileName, input.contentType);
    const reference = toMediaReference(objectKey);

    await this.client.send(
      new PutObjectCommand({
        Bucket: env.AWS_S3_BUCKET!,
        Key: objectKey,
        Body: input.buffer,
        ContentType: input.contentType,
        CacheControl: 'public, max-age=31536000, immutable'
      })
    );

    return {
      key: reference,
      url: resolveMediaUrl(reference),
      provider: 's3'
    };
  }

  async read(objectKey: string): Promise<MediaObjectStream> {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: env.AWS_S3_BUCKET!,
        Key: objectKey
      })
    );

    if (!response.Body) {
      throw new Error('Empty S3 object body');
    }

    const extension = objectKey.split('.').pop()?.toLowerCase();
    const fallbackContentType =
      extension === 'mp4'
        ? 'video/mp4'
        : extension === 'webm'
          ? 'video/webm'
          : extension === 'mov'
            ? 'video/quicktime'
            : extension === 'png'
              ? 'image/png'
              : extension === 'webp'
                ? 'image/webp'
                : extension === 'gif'
                  ? 'image/gif'
                  : 'image/jpeg';

    return {
      stream: response.Body as Readable,
      contentType:
        response.ContentType && response.ContentType !== 'application/octet-stream'
          ? response.ContentType
          : fallbackContentType,
      cacheControl: response.CacheControl ?? 'public, max-age=31536000, immutable'
    };
  }

  async delete(reference: string): Promise<void> {
    const objectKey = getMediaKey(reference);

    await this.client.send(
      new DeleteObjectCommand({
        Bucket: env.AWS_S3_BUCKET!,
        Key: objectKey
      })
    );
  }
}

function createMediaStorage(): MediaStorage {
  if (env.MEDIA_PROVIDER === 's3') {
    return new S3MediaStorage();
  }

  return new LocalMediaStorage();
}

export const mediaStorage = createMediaStorage();
