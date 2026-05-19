import { ApiError } from '../../shared/utils/api-error';
import { tourismRepository } from './tourism.repository';
import type { TourismDestinationInput, UpdateTourismDestinationInput } from './tourism.validation';

export class TourismService {
  list(includeInactive = false) {
    return tourismRepository.list(includeInactive);
  }

  async get(idOrSlug: string) {
    const destination = idOrSlug.length === 36 ? await tourismRepository.findById(idOrSlug) : await tourismRepository.findBySlug(idOrSlug);
    if (!destination) throw new ApiError(404, 'Tourism destination not found');
    return destination;
  }

  create(input: TourismDestinationInput) {
    return tourismRepository.create({
      ...input,
      sortOrder: input.sortOrder ?? 0,
      isActive: input.isActive ?? true
    });
  }

  async update(id: string, input: UpdateTourismDestinationInput) {
    await this.get(id);
    return tourismRepository.update(id, input);
  }

  async delete(id: string) {
    await this.get(id);
    return tourismRepository.delete(id);
  }
}

export const tourismService = new TourismService();
