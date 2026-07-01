import { LegalDocumentKind, type LegalDocument, type Prisma } from '@prisma/client';

import { prisma } from '../../shared/prisma/client';

export class LegalRepository {
  findByKind(kind: LegalDocumentKind) {
    return prisma.legalDocument.findUnique({ where: { kind } });
  }

  list() {
    return prisma.legalDocument.findMany({ orderBy: { kind: 'asc' } });
  }

  upsert(kind: LegalDocumentKind, data: Omit<Prisma.LegalDocumentCreateInput, 'kind'>) {
    return prisma.legalDocument.upsert({
      where: { kind },
      create: { kind, ...data },
      update: data
    });
  }
}

export const legalRepository = new LegalRepository();
export type { LegalDocument };
