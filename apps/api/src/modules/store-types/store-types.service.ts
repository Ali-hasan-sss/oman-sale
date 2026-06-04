import { ApiError } from '../../shared/utils/api-error';
import { storeTypesRepository } from './store-types.repository';
import type { CreateStoreTypeInput, UpdateStoreTypeInput } from './store-types.validation';

const mapStoreType = (item: NonNullable<Awaited<ReturnType<typeof storeTypesRepository.findById>>>) => ({
  id: item.id,
  slug: item.slug,
  nameAr: item.nameAr,
  nameEn: item.nameEn,
  icon: item.icon,
  sortOrder: item.sortOrder,
  isActive: item.isActive,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt
});

export class StoreTypesService {
  async listPublic() {
    const items = await storeTypesRepository.list(false);
    return items.map(mapStoreType);
  }

  async listForAdmin() {
    const items = await storeTypesRepository.list(true);
    return items.map(mapStoreType);
  }

  async getById(id: string) {
    const item = await storeTypesRepository.findById(id);
    if (!item) throw new ApiError(404, 'Store type not found');
    return mapStoreType(item);
  }

  async create(input: CreateStoreTypeInput) {
    const sortOrder = input.sortOrder ?? (await storeTypesRepository.getNextSortOrder());
    const item = await storeTypesRepository.create({ ...input, sortOrder });
    return mapStoreType(item);
  }

  async update(id: string, input: UpdateStoreTypeInput) {
    await this.getById(id);
    const item = await storeTypesRepository.update(id, input);
    return mapStoreType(item);
  }

  async delete(id: string) {
    await this.getById(id);
    await storeTypesRepository.softDelete(id);
    return { deleted: true };
  }
}

export const storeTypesService = new StoreTypesService();
