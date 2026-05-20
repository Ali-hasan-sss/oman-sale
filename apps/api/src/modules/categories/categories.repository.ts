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
      .count({ where: { parentId: id, deletedAt: null } })
      .then((count) => count > 0);
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
        await tx.categoryFilterOption.updateMany({
          where: { filterId: id, deletedAt: null },
          data: { deletedAt: new Date(), isActive: false }
        });
        await tx.categoryFilterOption.createMany({
          data: data.options.map((option, index) => ({
            filterId: id,
            labelAr: option.labelAr,
            labelEn: option.labelEn,
            slug: option.slug ? createSlug(option.slug) : createSlug(option.labelEn || option.labelAr),
            isActive: option.isActive ?? true,
            sortOrder: (index + 1) * 10
          }))
        });
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
