import type { Prisma } from '@prisma/client';

import { prisma } from '../../shared/prisma/client';

export class TourismRepository {
  list(includeInactive = false) {
    return prisma.tourismDestination.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
    });
  }

  findById(id: string) {
    return prisma.tourismDestination.findUnique({ where: { id } });
  }

  findBySlug(slug: string) {
    return prisma.tourismDestination.findUnique({ where: { slug } });
  }

  create(data: Prisma.TourismDestinationCreateInput) {
    return prisma.tourismDestination.create({ data });
  }

  update(id: string, data: Prisma.TourismDestinationUpdateInput) {
    return prisma.tourismDestination.update({ where: { id }, data });
  }

  delete(id: string) {
    return prisma.tourismDestination.delete({ where: { id } });
  }
}

export const tourismRepository = new TourismRepository();
