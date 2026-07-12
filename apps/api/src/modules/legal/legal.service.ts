import type { LegalDocument } from '@prisma/client';

import { ApiError } from '../../shared/utils/api-error';
import { legalRepository } from './legal.repository';
import { fromLegalDocumentKind, toLegalDocumentKind, type UpsertLegalDocumentInput } from './legal.validation';

type PublicLegalDocument = {
  kind: 'terms' | 'privacy' | 'refund';
  title: string;
  body: string;
  contactTitle: string;
  contactText: string;
  lastUpdated: string | null;
};

function mapPublic(document: LegalDocument, locale: 'ar' | 'en'): PublicLegalDocument {
  const isEn = locale === 'en';
  return {
    kind: fromLegalDocumentKind(document.kind),
    title: isEn ? document.titleEn : document.titleAr,
    body: isEn ? document.bodyEn : document.bodyAr,
    contactTitle: isEn ? document.contactTitleEn : document.contactTitleAr,
    contactText: isEn ? document.contactTextEn : document.contactTextAr,
    lastUpdated: (document.publishedAt ?? document.updatedAt).toISOString()
  };
}

function mapAdmin(document: LegalDocument) {
  return {
    kind: fromLegalDocumentKind(document.kind),
    titleAr: document.titleAr,
    titleEn: document.titleEn,
    bodyAr: document.bodyAr,
    bodyEn: document.bodyEn,
    contactTitleAr: document.contactTitleAr,
    contactTitleEn: document.contactTitleEn,
    contactTextAr: document.contactTextAr,
    contactTextEn: document.contactTextEn,
    isPublished: document.isPublished,
    publishedAt: document.publishedAt?.toISOString() ?? null,
    updatedAt: document.updatedAt.toISOString()
  };
}

export class LegalService {
  async getPublic(kind: 'terms' | 'privacy' | 'refund', locale: 'ar' | 'en') {
    const document = await legalRepository.findByKind(toLegalDocumentKind(kind));
    if (!document || !document.isPublished) {
      throw new ApiError(404, 'Legal document not found');
    }

    const body = locale === 'en' ? document.bodyEn : document.bodyAr;
    if (!body.trim()) {
      throw new ApiError(404, 'Legal document not found');
    }

    return mapPublic(document, locale);
  }

  async listForAdmin() {
    const documents = await legalRepository.list();
    return documents.map(mapAdmin);
  }

  async upsertForAdmin(kind: 'terms' | 'privacy' | 'refund', input: UpsertLegalDocumentInput) {
    const now = new Date();
    const existing = await legalRepository.findByKind(toLegalDocumentKind(kind));
    const publishedAt =
      input.isPublished ? existing?.publishedAt ?? now : null;

    const document = await legalRepository.upsert(toLegalDocumentKind(kind), {
      titleAr: input.titleAr,
      titleEn: input.titleEn,
      bodyAr: input.bodyAr,
      bodyEn: input.bodyEn,
      contactTitleAr: input.contactTitleAr ?? '',
      contactTitleEn: input.contactTitleEn ?? '',
      contactTextAr: input.contactTextAr ?? '',
      contactTextEn: input.contactTextEn ?? '',
      isPublished: input.isPublished ?? false,
      publishedAt
    });

    return mapAdmin(document);
  }
}

export const legalService = new LegalService();
