import { prisma } from '../../shared/prisma/client';
import { createSlug } from '../../shared/utils/slug';
import type {
  CreateCategoryDto,
  CreateCategoryFilterDto,
  ListAdminCategoriesQuery,
  ListCategoriesQuery,
  UpdateCategoryFilterDto,
  UpdateCategoryDto
} from './categories.validation';

const adminCategoriesPageSize = 25;

export class CategoriesRepository {
  async findAll(query: ListCategoriesQuery) {
    const categories = await prisma.category.findMany({
      where: {
        deletedAt: null,
        ...(query.type && { type: query.type }),
        ...(!query.includeInactive && { isActive: true })
      },
      include: {
        _count: {
          select: {
            ads: true,
            children: true
          }
        }
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
    });

    return categories.map((category) => ({
      ...category,
      name: (query.locale === 'en' ? category.nameEn : category.nameAr) || category.name
    }));
  }

  async findAllForAdmin(query: ListAdminCategoriesQuery) {
    const where = {
      deletedAt: null,
      ...(query.type && { type: query.type })
    };
    const include = {
      filters: {
        where: { deletedAt: null },
        orderBy: [{ sortOrder: 'asc' as const }, { titleAr: 'asc' as const }]
      },
      _count: {
        select: {
          ads: true,
          children: true,
          filters: true
        }
      }
    };
    const orderBy = [{ sortOrder: 'asc' as const }, { name: 'asc' as const }];

    if (query.all) {
      const items = await prisma.category.findMany({ where, include, orderBy });
      return { items, total: items.length, page: 1, limit: items.length };
    }

    const skip = (query.page - 1) * adminCategoriesPageSize;

    const [items, total] = await Promise.all([
      prisma.category.findMany({
        where,
        include,
        skip,
        take: adminCategoriesPageSize,
        orderBy
      }),
      prisma.category.count({ where })
    ]);

    return { items, total, page: query.page, limit: adminCategoriesPageSize };
  }

  findById(id: string) {
    return prisma.category.findFirst({ where: { id, deletedAt: null } });
  }

  hasChildren(id: string) {
    return prisma.category
      .count({ where: { parentId: id, deletedAt: null, isActive: true } })
      .then((count) => count > 0);
  }

  async collectCategoryPathIds(categoryId: string) {
    const pathIds: string[] = [];
    let currentId: string | null = categoryId;

    while (currentId) {
      pathIds.unshift(currentId);

      const category: { parentId: string | null } | null = await prisma.category.findFirst({
        where: { id: currentId, deletedAt: null },
        select: { parentId: true }
      });

      if (!category) break;
      currentId = category.parentId;
    }

    return pathIds;
  }

  listFiltersForPathIds(pathIds: string[], locale: 'ar' | 'en', includeInactive = false) {
    if (pathIds.length === 0) return Promise.resolve([]);

    return prisma.categoryFilter
      .findMany({
        where: {
          categoryId: { in: pathIds },
          deletedAt: null,
          ...(!includeInactive && { isActive: true })
        },
        include: {
          options: {
            where: {
              deletedAt: null,
              ...(!includeInactive && { isActive: true })
            },
            orderBy: [{ sortOrder: 'asc' }, { labelAr: 'asc' }]
          }
        },
        orderBy: [{ sortOrder: 'asc' }, { titleAr: 'asc' }]
      })
      .then((filters) => {
        const categoryOrder = new Map(pathIds.map((id, index) => [id, index]));

        return filters
          .sort((a, b) => {
            const categoryDiff = (categoryOrder.get(a.categoryId) ?? 0) - (categoryOrder.get(b.categoryId) ?? 0);
            if (categoryDiff !== 0) return categoryDiff;
            return a.sortOrder - b.sortOrder;
          })
          .map((filter) => ({
            ...filter,
            title: locale === 'en' ? filter.titleEn : filter.titleAr,
            options: filter.options.map((option) => ({
              ...option,
              label: locale === 'en' ? option.labelEn : option.labelAr
            }))
          }));
      });
  }

  findActiveFilterOptions(optionIds: string[]) {
    if (optionIds.length === 0) return Promise.resolve([]);

    return prisma.categoryFilterOption.findMany({
      where: {
        id: { in: optionIds },
        deletedAt: null,
        isActive: true,
        filter: { deletedAt: null, isActive: true }
      },
      select: { id: true, filterId: true }
    });
  }

  async isUnderAncestor(ancestorId: string, nodeId: string) {
    let currentId: string | null = nodeId;

    while (currentId) {
      if (currentId === ancestorId) return true;

      const category: { parentId: string | null } | null = await prisma.category.findFirst({
        where: { id: currentId, deletedAt: null },
        select: { parentId: true }
      });

      if (!category) return false;
      currentId = category.parentId;
    }

    return false;
  }

  findFilterById(id: string) {
    return prisma.categoryFilter.findFirst({ where: { id, deletedAt: null } });
  }

  findBySlug(slug: string) {
    return prisma.category.findFirst({ where: { slug, deletedAt: null }, select: { id: true } });
  }

  async create(data: CreateCategoryDto) {
    const slug = data.slug ? createSlug(data.slug) : createSlug(data.nameEn || data.nameAr);
    const lastCategory = await prisma.category.findFirst({
      where: {
        deletedAt: null,
        type: data.type,
        parentId: data.parentId ?? null
      },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true }
    });

    return prisma.category.create({
      data: {
        ...data,
        name: data.nameAr,
        slug,
        sortOrder: (lastCategory?.sortOrder ?? 0) + 10
      }
    });
  }

  update(id: string, data: UpdateCategoryDto) {
    const nextData = {
      ...data,
      ...(data.nameAr && { name: data.nameAr }),
      ...(data.slug && { slug: createSlug(data.slug) })
    };

    return prisma.category.update({ where: { id }, data: nextData });
  }

  softDelete(id: string) {
    return prisma.category.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
  }

  listFilters(categoryId: string, locale: 'ar' | 'en', includeInactive = false) {
    return prisma.categoryFilter.findMany({
      where: {
        categoryId,
        deletedAt: null,
        ...(!includeInactive && { isActive: true })
      },
      include: {
        options: {
          where: {
            deletedAt: null,
            ...(!includeInactive && { isActive: true })
          },
          orderBy: [{ sortOrder: 'asc' }, { labelAr: 'asc' }]
        }
      },
      orderBy: [{ sortOrder: 'asc' }, { titleAr: 'asc' }]
    }).then((filters) =>
      filters.map((filter) => ({
        ...filter,
        title: locale === 'en' ? filter.titleEn : filter.titleAr,
        options: filter.options.map((option) => ({
          ...option,
          label: locale === 'en' ? option.labelEn : option.labelAr
        }))
      }))
    );
  }

  async createFilter(categoryId: string, data: CreateCategoryFilterDto) {
    const lastFilter = await prisma.categoryFilter.findFirst({
      where: { categoryId, deletedAt: null },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true }
    });
    const slug = data.slug ? createSlug(data.slug) : createSlug(data.titleEn || data.titleAr);

    return prisma.categoryFilter.create({
      data: {
        categoryId,
        titleAr: data.titleAr,
        titleEn: data.titleEn,
        slug,
        isActive: data.isActive ?? true,
        sortOrder: (lastFilter?.sortOrder ?? 0) + 10,
        options: {
          create: data.options.map((option, index) => ({
            labelAr: option.labelAr,
            labelEn: option.labelEn,
            slug: option.slug ? createSlug(option.slug) : createSlug(option.labelEn || option.labelAr),
            isActive: option.isActive ?? true,
            sortOrder: (index + 1) * 10
          }))
        }
      },
      include: { options: true }
    });
  }

  async updateFilter(id: string, data: UpdateCategoryFilterDto) {
    return prisma.$transaction(async (tx) => {
      const filter = await tx.categoryFilter.update({
        where: { id },
        data: {
          ...(data.titleAr && { titleAr: data.titleAr }),
          ...(data.titleEn && { titleEn: data.titleEn }),
          ...(data.slug && { slug: createSlug(data.slug) }),
          ...(data.isActive !== undefined && { isActive: data.isActive })
        }
      });

      if (data.options) {
        const existing = await tx.categoryFilterOption.findMany({
          where: { filterId: id, deletedAt: null },
          orderBy: { sortOrder: 'asc' }
        });
        const usedIds = new Set<string>();

        for (let index = 0; index < data.options.length; index++) {
          const option = data.options[index]!;
          const payload = {
            labelAr: option.labelAr,
            labelEn: option.labelEn,
            slug: option.slug ? createSlug(option.slug) : createSlug(option.labelEn || option.labelAr),
            isActive: option.isActive ?? true,
            sortOrder: (index + 1) * 10
          };

          const match =
            existing.find((item) => item.slug === payload.slug && !usedIds.has(item.id)) ??
            existing.find((item, itemIndex) => itemIndex === index && !usedIds.has(item.id));

          if (match) {
            await tx.categoryFilterOption.update({
              where: { id: match.id },
              data: payload
            });
            usedIds.add(match.id);
            continue;
          }

          const created = await tx.categoryFilterOption.create({
            data: { filterId: id, ...payload }
          });
          usedIds.add(created.id);
        }

        for (const option of existing) {
          if (usedIds.has(option.id)) continue;

          await tx.categoryFilterOption.update({
            where: { id: option.id },
            data: {
              deletedAt: new Date(),
              isActive: false,
              slug: `${option.slug}__archived__${option.id.slice(0, 8)}`
            }
          });
        }
      }

      return tx.categoryFilter.findUnique({ where: { id }, include: { options: { where: { deletedAt: null } } } }) ?? filter;
    });
  }

  softDeleteFilter(id: string) {
    return prisma.categoryFilter.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
        options: { updateMany: { where: { deletedAt: null }, data: { deletedAt: new Date(), isActive: false } } }
      }
    });
  }
}

export const categoriesRepository = new CategoriesRepository();
