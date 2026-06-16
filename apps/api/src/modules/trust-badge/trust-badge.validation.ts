import { z } from 'zod';

import { imageReferenceSchema } from '../../shared/utils/media-reference';

export const submitUserTrustBadgeSchema = z.object({
  documentType: z.enum(['NATIONAL_ID', 'PASSPORT']),
  documentUrl: imageReferenceSchema
});

export const submitStoreTrustBadgeSchema = z.object({
  commercialRegDocUrl: imageReferenceSchema,
  occiDocUrl: imageReferenceSchema.optional(),
  smeDocUrl: imageReferenceSchema.optional(),
  otherDocUrl: imageReferenceSchema.optional(),
  otherDocLabel: z.string().trim().max(120).optional()
}).superRefine((value, ctx) => {
  if (value.otherDocUrl && !value.otherDocLabel?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Other document label is required when other document is provided',
      path: ['otherDocLabel']
    });
  }
});

export const rejectTrustBadgeSchema = z.object({
  reason: z.string().trim().min(3).max(500)
});

export const listTrustBadgeQuerySchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).default('PENDING'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20)
});

export type SubmitUserTrustBadgeDto = z.infer<typeof submitUserTrustBadgeSchema>;
export type SubmitStoreTrustBadgeDto = z.infer<typeof submitStoreTrustBadgeSchema>;
export type RejectTrustBadgeDto = z.infer<typeof rejectTrustBadgeSchema>;
export type ListTrustBadgeQuery = z.infer<typeof listTrustBadgeQuerySchema>;
