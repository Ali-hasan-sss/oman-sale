import { ApiError } from '../../shared/utils/api-error';
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
    return categoriesRepository.findAll(query);
  }

  listForAdmin(query: ListAdminCategoriesQuery) {
    return categoriesRepository.findAllForAdmin(query);
  }

  async create(dto: CreateCategoryDto) {
    return categoriesRepository.create(dto);
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const category = await categoriesRepository.findById(id);
    if (!category) throw new ApiError(404, 'Category not found');
    return categoriesRepository.update(id, dto);
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

  async listFilters(categoryId: string, locale: 'ar' | 'en', includeInactive = false) {
    const category = await categoriesRepository.findById(categoryId);
    if (!category) throw new ApiError(404, 'Category not found');
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

export const categoriesService = new CategoriesService();
