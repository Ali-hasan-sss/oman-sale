import { NotificationType, PushPlatform } from '@prisma/client';
import { z } from 'zod';

export const localizedNotificationTextSchema = z.object({
  ar: z.string().trim().min(1).max(200),
  en: z.string().trim().min(1).max(200)
});

export const notificationChannelsSchema = z.object({
  inApp: z.boolean().optional(),
  email: z.boolean().optional(),
  whatsapp: z.boolean().optional(),
  push: z.boolean().optional()
});

export const createNotificationSchema = z.object({
  userId: z.string().uuid(),
  title: z.string().min(1),
  body: z.string().min(1),
  type: z.nativeEnum(NotificationType),
  metadata: z.record(z.unknown()).optional()
});

export const registerPushTokenSchema = z.object({
  token: z.string().trim().min(1).max(4096),
  platform: z.nativeEnum(PushPlatform)
});

export const removePushTokenSchema = z.object({
  token: z.string().trim().min(1).max(4096)
});

export type CreateNotificationDto = z.infer<typeof createNotificationSchema>;
