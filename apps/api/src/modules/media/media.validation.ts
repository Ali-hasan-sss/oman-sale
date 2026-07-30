import { z } from 'zod';

import type { MediaFolder } from '../../shared/utils/media-storage';

export const mediaFolderSchema = z.enum(['ads', 'stores', 'profiles', 'chat', 'banners', 'hero', 'tourism', 'articles', 'categories', 'general', 'verification']);

export const uploadMediaQuerySchema = z.object({
  folder: mediaFolderSchema.default('general')
});

export type UploadMediaQuery = z.infer<typeof uploadMediaQuerySchema>;
export type MediaFolderInput = MediaFolder;
