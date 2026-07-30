import { ApiError } from '../../shared/utils/api-error';
import { resolveMediaUrl } from '../../shared/utils/media-reference';
import { categoriesRepository } from './categories.repository';
import type {
  CreateCategoryDto,
  CreateCategoryFilterDto,
  ListAdminCategoriesQuery,
  ListCategoriesQuery,
  UpdateCategoryFilterDto,
  UpdateCategoryDto
} from './categories.validation';

export class CategoriesService {
  list(query: ListCategoriesQuery) {
    return categoriesRepository.findAll(query).then((categories) => categories.map(mapCategoryForPublic));
  }

  listForAdmin(query: ListAdminCategoriesQuery) {
    return categoriesRepository.findAllForAdmin(query);
  }

  async create(dto: CreateCategoryDto) {
    await this.assertValidParent(dto.parentId ?? null);
    this.assertStoreBasePrice(dto.parentId ?? null, dto.storeBaseMonthlyPrice);
    return categoriesRepository.create(dto);
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const category = await categoriesRepository.findById(id);
    if (!category) throw new ApiError(404, 'Category not found');

    if (dto.parentId !== undefined) {
      if (dto.parentId === id) {
        throw new ApiError(400, 'Category cannot be its own parent');
      }
      await this.assertValidParent(dto.parentId, id);
    }

    const nextParentId = dto.parentId !== undefined ? dto.parentId : category.parentId;
    this.assertStoreBasePrice(nextParentId, dto.storeBaseMonthlyPrice);

    if (nextParentId && dto.storeBaseMonthlyPrice !== undefined) {
      dto = { ...dto, storeBaseMonthlyPrice: null };
    }

    const nextIcon = dto.icon !== undefined ? dto.icon : category.icon;
    const nextIconImageUrl = dto.iconImageUrl !== undefined ? dto.iconImageUrl : category.iconImageUrl;
    if (!nextIcon && !nextIconImageUrl) {
      throw new ApiError(400, 'Category must have an icon or icon image');
    }

    return categoriesRepository.update(id, dto);
  }

  private assertStoreBasePrice(parentId: string | null | undefined, storeBaseMonthlyPrice?: number | null) {
    if (storeBaseMonthlyPrice === undefined) return;
    if (parentId) {
      throw new ApiError(400, 'Store base monthly price applies to main categories only');
    }
  }

  private async assertValidParent(parentId: string | null, categoryId?: string) {
    if (!parentId) return;

    const parent = await categoriesRepository.findById(parentId);
    if (!parent) throw new ApiError(400, 'Parent category not found');

    if (categoryId) {
      const createsCycle = await categoriesRepository.isUnderAncestor(categoryId, parentId);
      if (createsCycle) {
        throw new ApiError(400, 'Cannot move a category under one of its descendants');
      }
    }
  }

  async checkSlugAvailability(slug: string, excludeId?: string) {
    const category = await categoriesRepository.findBySlug(slug);
    return { available: !category || category.id === excludeId };
  }

  async delete(id: string) {
    const category = await categoriesRepository.findById(id);
    if (!category) throw new ApiError(404, 'Category not found');
    return categoriesRepository.softDelete(id);
  }

  async listFilters(categoryId: string, locale: 'ar' | 'en', includeInactive = false, includeAncestors = false) {
    const category = await categoriesRepository.findById(categoryId);
    if (!category) throw new ApiError(404, 'Category not found');

    if (includeAncestors) {
      const pathIds = await categoriesRepository.collectCategoryPathIds(categoryId);
      return categoriesRepository.listFiltersForPathIds(pathIds, locale, includeInactive);
    }

    return categoriesRepository.listFilters(categoryId, locale, includeInactive);
  }

  async createFilter(categoryId: string, dto: CreateCategoryFilterDto) {
    const category = await categoriesRepository.findById(categoryId);
    if (!category) throw new ApiError(404, 'Category not found');
    return categoriesRepository.createFilter(categoryId, dto);
  }

  async updateFilter(id: string, dto: UpdateCategoryFilterDto) {
    const filter = await categoriesRepository.findFilterById(id);
    if (!filter) throw new ApiError(404, 'Category filter not found');
    return categoriesRepository.updateFilter(id, dto);
  }

  async deleteFilter(id: string) {
    const filter = await categoriesRepository.findFilterById(id);
    if (!filter) throw new ApiError(404, 'Category filter not found');
    return categoriesRepository.softDeleteFilter(id);
  }
}

const mapCategoryForPublic = <T extends { iconImageUrl?: string | null }>(category: T) => ({
  ...category,
  iconImageUrl: category.iconImageUrl ? resolveMediaUrl(category.iconImageUrl) : category.iconImageUrl
});

export const categoriesService = new CategoriesService();
