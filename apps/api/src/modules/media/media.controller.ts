import type { Request, Response } from 'express';

import { mediaService } from './media.service';
import type { UploadMediaQuery } from './media.validation';

export class MediaController {
  async getConfig(_req: Request, res: Response) {
    res.json({ data: mediaService.getPublicConfig() });
  }

  async streamFile(req: Request, res: Response) {
    const objectKey = decodeURIComponent(String((req.params as Record<string, string>)[0] ?? ''));
    const file = await mediaService.streamObject(objectKey);

    res.setHeader('Content-Type', file.contentType);
    if (file.cacheControl) {
      res.setHeader('Cache-Control', file.cacheControl);
    }

    file.stream.on('error', () => {
      if (!res.headersSent) {
        res.status(404).end();
      }
    });

    file.stream.pipe(res);
  }

  async upload(req: Request, res: Response) {
    res.status(201).json({
      data: await mediaService.upload(req.file, req.query as unknown as UploadMediaQuery)
    });
  }
}

export const mediaController = new MediaController();
