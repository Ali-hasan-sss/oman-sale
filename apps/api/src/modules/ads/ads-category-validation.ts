import { ApiError } from '../../shared/utils/api-error';
import { categoriesRepository } from '../categories/categories.repository';

export const PASSENGER_CARS_SLUG = 'passenger-cars';
export const MODEL_YEAR_MIN = 1900;
export const MODEL_YEAR_MAX = 2028;

export async function assertValidAdCategorySelection(
  categoryId: string | null | undefined,
  filterOptionIds: string[],
  modelYear?: number | null
) {
  if (!categoryId) {
    if (filterOptionIds.length > 0) {
      throw new ApiError(400, 'Invalid filter option for selected category', 'CATEGORY_FILTER_INVALID');
    }

    if (modelYear !== undefined && modelYear !== null) {
      throw new ApiError(400, 'Model year is only allowed for passenger cars', 'MODEL_YEAR_INVALID');
    }

    return;
  }

  const category = await categoriesRepository.findById(categoryId);
  if (!category || !category.isActive) {
    throw new ApiError(400, 'Category not found', 'CATEGORY_NOT_FOUND');
  }

  const pathIds = await categoriesRepository.collectCategoryPathIds(categoryId);
  const categoryFilters = await categoriesRepository.listFiltersForPathIds(pathIds, 'ar');

  if (filterOptionIds.length > 0) {
    const options = await categoriesRepository.findActiveFilterOptions(filterOptionIds);
    if (options.length !== new Set(filterOptionIds).size) {
      throw new ApiError(400, 'Invalid filter option for selected category', 'CATEGORY_FILTER_INVALID');
    }

    const optionsByFilter = new Set<string>();

    for (const option of options) {
      if (!categoryFilters.some((filter) => filter.id === option.filterId)) {
        throw new ApiError(400, 'Invalid filter option for selected category', 'CATEGORY_FILTER_INVALID');
      }

      if (optionsByFilter.has(option.filterId)) {
        throw new ApiError(400, 'Only one option per filter is allowed', 'CATEGORY_FILTER_INVALID');
      }

      optionsByFilter.add(option.filterId);
    }
  }

  const passengerCars = await categoriesRepository.findBySlug(PASSENGER_CARS_SLUG);
  const isPassengerCar =
    passengerCars !== null && (await categoriesRepository.isUnderAncestor(passengerCars.id, categoryId));

  if (isPassengerCar) {
    if (
      modelYear === undefined ||
      modelYear === null ||
      modelYear < MODEL_YEAR_MIN ||
      modelYear > MODEL_YEAR_MAX
    ) {
      throw new ApiError(400, 'Model year is required for passenger cars', 'MODEL_YEAR_REQUIRED');
    }
  } else if (modelYear !== undefined && modelYear !== null) {
    throw new ApiError(400, 'Model year is only allowed for passenger cars', 'MODEL_YEAR_INVALID');
  }
}
