export type UploadInput = {
  buffer: Buffer;
  fileName: string;
  contentType: string;
};

export type UploadResult = {
  url: string;
  provider: 'local' | 'cloudinary' | 's3';
  key?: string;
};

export interface MediaStorage {
  upload(input: UploadInput): Promise<UploadResult>;
  delete(key: string): Promise<void>;
}

export class LocalMediaStorage implements MediaStorage {
  async upload(input: UploadInput): Promise<UploadResult> {
    return {
      url: `/uploads/${input.fileName}`,
      provider: 'local',
      key: input.fileName
    };
  }

  async delete(_key: string): Promise<void> {
    return Promise.resolve();
  }
}

export const mediaStorage: MediaStorage = new LocalMediaStorage();
