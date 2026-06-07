import { z } from 'zod';

export const assistantLocaleSchema = z.enum(['ar', 'en']);

export const assistantMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(4000)
});

export const assistantChatSchema = z.object({
  locale: assistantLocaleSchema.default('ar'),
  messages: z.array(assistantMessageSchema).min(1).max(50),
  isAuthenticated: z.boolean().optional().default(false)
});

export type AssistantChatDto = z.infer<typeof assistantChatSchema>;
export type AssistantLocale = z.infer<typeof assistantLocaleSchema>;
