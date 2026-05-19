import { AppEvents } from '../../shared/constants/events';
import { ApiError } from '../../shared/utils/api-error';
import { eventBus } from '../../shared/utils/event-bus';
import { createSlug } from '../../shared/utils/slug';
import type { ViewerContext } from '../../shared/utils/viewer-context';
import { adsRepository } from './ads.repository';
import type { AdminListAdsQuery, CreateAdDto, ListAdsQuery, ReportAdDto, UpdateAdDto } from './ads.validation';

export class AdsService {
  list(query: ListAdsQuery) {
    return adsRepository.list(query);
  }

  listLatest(query: ListAdsQuery) {
    return adsRepository.list(query, 'latest');
  }

  listFeatured(query: ListAdsQuery) {
    return adsRepository.list(query, 'featured');
  }

  listForAdmin(query: AdminListAdsQuery) {
    return adsRepository.listForAdmin(query);
  }

  listForUser(userId: string, query: ListAdsQuery) {
    return adsRepository.listForUser(userId, query);
  }

  async getById(id: string, viewer?: ViewerContext) {
    const ad = await adsRepository.findById(id);
    if (!ad) throw new ApiError(404, 'Ad not found');

    if (viewer) {
      const counted = await adsRepository.recordView(id, ad.userId, viewer);
      if (counted) {
        return { ...ad, views: ad.views + 1 };
      }
    }

    return ad;
  }

  async getByIdForAdmin(id: string) {
    const ad = await adsRepository.findById(id);
    if (!ad) throw new ApiError(404, 'Ad not found');
    return ad;
  }

  async listSimilar(id: string) {
    const ad = await adsRepository.findById(id);
    if (!ad) throw new ApiError(404, 'Ad not found');
    return adsRepository.listSimilar(id);
  }

  listFavorites(userId: string) {
    return adsRepository.listFavorites(userId);
  }

  listFavoriteIds(userId: string) {
    return adsRepository.listFavoriteIds(userId);
  }

  create(userId: string, dto: CreateAdDto) {
    const slug = `${createSlug(dto.title)}-${Date.now()}`;
    return adsRepository.create(userId, slug, { ...dto, status: 'ACTIVE' });
  }

  createForAdmin(userId: string, dto: CreateAdDto) {
    return this.create(userId, dto);
  }

  async update(id: string, userId: string, dto: UpdateAdDto) {
    const ad = await adsRepository.findById(id);
    if (!ad) throw new ApiError(404, 'Ad not found');
    if (ad.userId !== userId) throw new ApiError(403, 'Only owner can update ad');
    return adsRepository.update(id, this.stripProtectedAdFields(dto));
  }

  async updateForAdmin(id: string, dto: UpdateAdDto) {
    const ad = await adsRepository.findById(id);
    if (!ad) throw new ApiError(404, 'Ad not found');
    return adsRepository.update(id, dto);
  }

  async approve(id: string) {
    const ad = await adsRepository.approve(id);
    eventBus.emit(AppEvents.AD_APPROVED, { adId: id, userId: ad.userId });
    return ad;
  }

  async delete(id: string, userId: string) {
    const ad = await adsRepository.findById(id);
    if (!ad) throw new ApiError(404, 'Ad not found');
    if (ad.userId !== userId) throw new ApiError(403, 'Only owner can delete ad');
    return adsRepository.softDelete(id);
  }

  async deleteForAdmin(id: string) {
    const ad = await adsRepository.findById(id);
    if (!ad) throw new ApiError(404, 'Ad not found');
    return adsRepository.softDelete(id);
  }

  async restoreForAdmin(id: string) {
    const ad = await adsRepository.findById(id);
    if (!ad) {
      const restored = await adsRepository.restore(id);
      return restored;
    }
    return adsRepository.restore(id);
  }

  async activateForAdmin(id: string) {
    const ad = await adsRepository.findById(id);
    if (!ad) throw new ApiError(404, 'Ad not found');
    return adsRepository.setActive(id, true);
  }

  async deactivateForAdmin(id: string) {
    const ad = await adsRepository.findById(id);
    if (!ad) throw new ApiError(404, 'Ad not found');
    return adsRepository.setActive(id, false);
  }

  async markSold(id: string, userId: string) {
    const ad = await adsRepository.findById(id);
    if (!ad) throw new ApiError(404, 'Ad not found');
    if (ad.userId !== userId) throw new ApiError(403, 'Only owner can mark ad as sold');
    return adsRepository.markSold(id);
  }

  async unmarkSold(id: string, userId: string) {
    const ad = await adsRepository.findById(id);
    if (!ad) throw new ApiError(404, 'Ad not found');
    if (ad.userId !== userId) throw new ApiError(403, 'Only owner can unmark ad as sold');
    return adsRepository.unmarkSold(id);
  }

  private stripProtectedAdFields(dto: UpdateAdDto): UpdateAdDto {
    const safe = { ...dto } as UpdateAdDto & { isActive?: boolean; isSold?: boolean };
    delete safe.status;
    delete safe.isActive;
    delete safe.isSold;
    return safe;
  }

  async favorite(id: string, userId: string) {
    const ad = await adsRepository.findById(id);
    if (!ad) throw new ApiError(404, 'Ad not found');
    return adsRepository.favorite(id, userId);
  }

  unfavorite(id: string, userId: string) {
    return adsRepository.unfavorite(id, userId);
  }

  async report(id: string, userId: string, dto: ReportAdDto) {
    const ad = await adsRepository.findById(id);
    if (!ad) throw new ApiError(404, 'Ad not found');
    return adsRepository.report(id, userId, dto);
  }
}

export const adsService = new AdsService();
