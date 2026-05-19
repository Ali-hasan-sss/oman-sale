import { NotificationType } from '@prisma/client';
import { z } from 'zod';

export const createNotificationSchema = z.object({
  userId: z.string().uuid(),
  title: z.string().min(1),
  body: z.string().min(1),
  type: z.nativeEnum(NotificationType)
});

export type CreateNotificationDto = z.infer<typeof createNotificationSchema>;
