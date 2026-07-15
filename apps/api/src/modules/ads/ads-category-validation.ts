import { ApiError } from '../../shared/utils/api-error';
import { categoriesRepository } from '../categories/categories.repository';

export async function assertValidAdCategorySelection(categoryId: string, filterOptionIds: string[]) {
  const category = await categoriesRepository.findById(categoryId);
  if (!category || !category.isActive) {
    throw new ApiError(400, 'Category not found', 'CATEGORY_NOT_FOUND');
  }

  const hasChildren = await categoriesRepository.hasChildren(categoryId);
  if (hasChildren) {
    throw new ApiError(400, 'Select a subcategory to continue', 'CATEGORY_SUBCATEGORY_REQUIRED');
  }

  const pathIds = await categoriesRepository.collectCategoryPathIds(categoryId);
  const requiredFilters = await categoriesRepository.listFiltersForPathIds(pathIds, 'ar');

  if (requiredFilters.length === 0) return;

  const options = await categoriesRepository.findActiveFilterOptions(filterOptionIds);
  const optionsByFilter = new Map<string, string>();

  for (const option of options) {
    if (!requiredFilters.some((filter) => filter.id === option.filterId)) {
      throw new ApiError(400, 'Invalid filter option for selected category', 'CATEGORY_FILTER_INVALID');
    }

    if (optionsByFilter.has(option.filterId)) {
      throw new ApiError(400, 'Only one option per filter is allowed', 'CATEGORY_FILTER_INVALID');
    }

    optionsByFilter.set(option.filterId, option.id);
  }

  for (const filter of requiredFilters) {
    if (!optionsByFilter.has(filter.id)) {
      throw new ApiError(400, 'All category filters are required', 'CATEGORY_FILTER_REQUIRED', {
        filterId: filter.id
      });
    }
  }
}
