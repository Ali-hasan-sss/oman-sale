import { LegalDocumentKind } from '@prisma/client';
import { z } from 'zod';

export const legalKindParamSchema = z.object({
  kind: z.enum(['terms', 'privacy'])
});

export const upsertLegalDocumentSchema = z.object({
  titleAr: z.string().trim().min(1).max(300),
  titleEn: z.string().trim().min(1).max(300),
  bodyAr: z.string().trim().min(1),
  bodyEn: z.string().trim().min(1),
  contactTitleAr: z.string().trim().max(300).optional().default(''),
  contactTitleEn: z.string().trim().max(300).optional().default(''),
  contactTextAr: z.string().trim().max(1000).optional().default(''),
  contactTextEn: z.string().trim().max(1000).optional().default(''),
  isPublished: z.boolean().optional().default(false)
});

export type UpsertLegalDocumentInput = z.infer<typeof upsertLegalDocumentSchema>;

export function toLegalDocumentKind(kind: 'terms' | 'privacy'): LegalDocumentKind {
  return kind === 'terms' ? LegalDocumentKind.TERMS : LegalDocumentKind.PRIVACY;
}

export function fromLegalDocumentKind(kind: LegalDocumentKind): 'terms' | 'privacy' {
  return kind === LegalDocumentKind.TERMS ? 'terms' : 'privacy';
}
