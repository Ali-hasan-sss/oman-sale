import { ApiError } from '../../shared/utils/api-error';
import { resolveTourismDestinationMedia } from '../../shared/utils/resolve-entity-media';
import { tourismRepository } from './tourism.repository';
import type { TourismDestinationInput, UpdateTourismDestinationInput } from './tourism.validation';

export class TourismService {
  async list(includeInactive = false) {
    const items = await tourismRepository.list(includeInactive);
    return items.map(resolveTourismDestinationMedia);
  }

  async get(idOrSlug: string) {
    const destination = idOrSlug.length === 36 ? await tourismRepository.findById(idOrSlug) : await tourismRepository.findBySlug(idOrSlug);
    if (!destination) throw new ApiError(404, 'Tourism destination not found');
    return resolveTourismDestinationMedia(destination);
  }

  create(input: TourismDestinationInput) {
    return tourismRepository
      .create({
        ...input,
        galleryImages: input.galleryImages ?? [],
        sortOrder: input.sortOrder ?? 0,
        isActive: input.isActive ?? true
      })
      .then(resolveTourismDestinationMedia);
  }

  async update(id: string, input: UpdateTourismDestinationInput) {
    await this.get(id);
    return tourismRepository.update(id, input).then(resolveTourismDestinationMedia);
  }

  async delete(id: string) {
    await this.get(id);
    return tourismRepository.delete(id);
  }
}

export const tourismService = new TourismService();
