import { z } from 'zod';

import { QUICK_REPLY_INTENTS } from './assistant-canned';
import { assistantLocaleSchema } from './assistant.validation';

export const assistantQuickReplySchema = z.object({
  locale: assistantLocaleSchema.default('ar'),
  intent: z.enum(QUICK_REPLY_INTENTS)
});

export type AssistantQuickReplyDto = z.infer<typeof assistantQuickReplySchema>;
