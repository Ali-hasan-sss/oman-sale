import { NotificationType } from '@prisma/client';

import { AppEvents } from '../../shared/constants/events';
import { ApiError } from '../../shared/utils/api-error';
import { eventBus } from '../../shared/utils/event-bus';
import { resolveAdMedia, resolveAdsMedia } from '../../shared/utils/resolve-entity-media';
import { createSlug } from '../../shared/utils/slug';
import type { ViewerContext } from '../../shared/utils/viewer-context';
import { sendAdminNotification } from '../notifications/send-admin-notification';
import { storesService } from '../stores/stores.service';
import { assertValidAdCategorySelection } from './ads-category-validation';
import { adsRepository } from './ads.repository';
import type { AdminListAdsQuery, CreateAdDto, ListAdsQuery, ReportAdDto, UpdateAdDto } from './ads.validation';

type AdWithImages = { images?: Array<{ imageUrl: string }> };
type PagedAds<T extends AdWithImages> = { items: T[]; total: number; page: number; limit: number };

export class AdsService {
  private resolvePage<T extends AdWithImages>(page: PagedAds<T>): PagedAds<T> {
    return { ...page, items: resolveAdsMedia(page.items) };
  }

  async list(query: ListAdsQuery) {
    return this.resolvePage(await adsRepository.list(query));
  }

  async listLatest(query: ListAdsQuery) {
    return this.resolvePage(await adsRepository.list(query, 'latest'));
  }

  async listFeatured(query: ListAdsQuery) {
    return this.resolvePage(await adsRepository.list(query, 'featured'));
  }

  async listForAdmin(query: AdminListAdsQuery) {
    return this.resolvePage(await adsRepository.listForAdmin(query));
  }

  async listForUser(userId: string, query: ListAdsQuery) {
    return this.resolvePage(await adsRepository.listForUser(userId, query));
  }

  async getById(id: string, viewer?: ViewerContext) {
    const ad = await adsRepository.findById(id);
    if (!ad) throw new ApiError(404, 'Ad not found');

    if (viewer) {
      const counted = await adsRepository.recordView(id, ad.userId, viewer);
      if (counted) {
        return resolveAdMedia({ ...ad, views: ad.views + 1 });
      }
    }

    return resolveAdMedia(ad);
  }

  async getByIdForAdmin(id: string) {
    const ad = await adsRepository.findById(id);
    if (!ad) throw new ApiError(404, 'Ad not found');
    return resolveAdMedia(ad);
  }

  async listSimilar(id: string) {
    const ad = await adsRepository.findById(id);
    if (!ad) throw new ApiError(404, 'Ad not found');
    return resolveAdsMedia(await adsRepository.listSimilar(id));
  }

  async listFavorites(userId: string) {
    return resolveAdsMedia(await adsRepository.listFavorites(userId));
  }

  listFavoriteIds(userId: string) {
    return adsRepository.listFavoriteIds(userId);
  }

  async create(userId: string, dto: CreateAdDto) {
    if (dto.storeId) {
      await storesService.assertCanPublishAsStore(userId, dto.storeId);
    }

    await assertValidAdCategorySelection(dto.categoryId, dto.filterOptionIds ?? [], dto.modelYear);

    const slug = `${createSlug(dto.title)}-${Date.now()}`;
    const ad = await adsRepository.create(userId, slug, { ...dto, status: 'ACTIVE' });

    if (dto.storeId) {
      await storesService.applyStoreListingPromotion(ad.id, dto.storeId);
      const promoted = await adsRepository.findById(ad.id);
      return promoted ? resolveAdMedia(promoted) : promoted;
    }

    return resolveAdMedia(ad);
  }

  createForAdmin(userId: string, dto: CreateAdDto) {
    return this.create(userId, dto);
  }

  async update(id: string, userId: string, dto: UpdateAdDto) {
    const ad = await adsRepository.findById(id);
    if (!ad) throw new ApiError(404, 'Ad not found');
    if (ad.userId !== userId) throw new ApiError(403, 'Only owner can update ad');

    const nextCategoryId = dto.categoryId ?? ad.categoryId;
    const nextFilterOptionIds = dto.filterOptionIds ?? [];
    const nextModelYear = dto.modelYear !== undefined ? dto.modelYear : ad.modelYear;

    if (dto.categoryId !== undefined || dto.filterOptionIds !== undefined || dto.modelYear !== undefined) {
      await assertValidAdCategorySelection(nextCategoryId, nextFilterOptionIds, nextModelYear);
    }

    const updated = await adsRepository.update(id, this.stripProtectedAdFields(dto));
    return resolveAdMedia(updated);
  }

  async updateForAdmin(id: string, dto: UpdateAdDto) {
    const ad = await adsRepository.findById(id);
    if (!ad) throw new ApiError(404, 'Ad not found');

    const nextCategoryId = dto.categoryId ?? ad.categoryId;
    const nextFilterOptionIds = dto.filterOptionIds ?? [];
    const nextModelYear = dto.modelYear !== undefined ? dto.modelYear : ad.modelYear;

    if (dto.categoryId !== undefined || dto.filterOptionIds !== undefined || dto.modelYear !== undefined) {
      await assertValidAdCategorySelection(nextCategoryId, nextFilterOptionIds, nextModelYear);
    }

    const updated = await adsRepository.update(id, dto);
    return resolveAdMedia(updated);
  }

  async approve(id: string) {
    const ad = await adsRepository.approve(id);
    eventBus.emit(AppEvents.AD_APPROVED, { adId: id, userId: ad.userId });
    return resolveAdMedia(ad);
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
    if (ad.userId === userId) throw new ApiError(400, 'You cannot report your own listing');

    const existing = await adsRepository.findReportByReporter(id, userId);
    if (existing) throw new ApiError(409, 'You have already reported this listing');

    const report = await adsRepository.report(id, userId, dto);

    await sendAdminNotification({
      type: NotificationType.ADMIN_REPORT,
      title: { ar: 'بلاغ جديد على إعلان', en: 'New listing report' },
      body: {
        ar: `تم تقديم بلاغ جديد على الإعلان "${ad.title}".`,
        en: `A new report was submitted for listing "${ad.title}".`
      },
      metadata: { adId: id, reportId: report.id, reason: dto.reason }
    }).catch((error) => {
      console.error('[notifications] failed to send admin report notification', error);
    });

    return report;
  }
}

export const adsService = new AdsService();
