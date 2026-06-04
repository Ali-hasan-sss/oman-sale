import type { Prisma } from '@prisma/client';

import { prisma } from '../../shared/prisma/client';
import { createSlug } from '../../shared/utils/slug';
import type { CreateStoreTypeInput, UpdateStoreTypeInput } from './store-types.validation';

export class StoreTypesRepository {
  list(includeInactive = false) {
    return prisma.storeType.findMany({
      where: {
        deletedAt: null,
        ...(!includeInactive && { isActive: true })
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
    });
  }

  findById(id: string) {
    return prisma.storeType.findFirst({ where: { id, deletedAt: null } });
  }

  findBySlug(slug: string) {
    return prisma.storeType.findFirst({ where: { slug: createSlug(slug), deletedAt: null } });
  }

  create(input: CreateStoreTypeInput) {
    const slug = createSlug(input.nameEn || input.nameAr);
    return prisma.storeType.create({
      data: {
        slug,
        nameAr: input.nameAr,
        nameEn: input.nameEn,
        icon: input.icon?.trim() || null,
        sortOrder: input.sortOrder ?? 0,
        isActive: input.isActive ?? true
      }
    });
  }

  async update(id: string, input: UpdateStoreTypeInput) {
    const data: Prisma.StoreTypeUpdateInput = {
      ...(input.nameAr !== undefined && { nameAr: input.nameAr }),
      ...(input.nameEn !== undefined && { nameEn: input.nameEn }),
      ...(input.icon !== undefined && { icon: input.icon?.trim() || null }),
      ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
      ...(input.isActive !== undefined && { isActive: input.isActive })
    };

    if (input.nameEn || input.nameAr) {
      data.slug = createSlug(input.nameEn || input.nameAr || '');
    }

    return prisma.storeType.update({ where: { id }, data });
  }

  softDelete(id: string) {
    return prisma.storeType.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false }
    });
  }

  getNextSortOrder() {
    return prisma.storeType
      .aggregate({ _max: { sortOrder: true }, where: { deletedAt: null } })
      .then((result) => (result._max.sortOrder ?? -1) + 1);
  }
}

export const storeTypesRepository = new StoreTypesRepository();
