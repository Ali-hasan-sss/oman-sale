import { RaffleStatus } from '@prisma/client';

import { ApiError } from '../../shared/utils/api-error';
import { resolveMediaUrl } from '../../shared/utils/media-reference';
import { buildRaffleHeroSuggestion } from './raffles-hero.utils';
import { rafflesRepository } from './raffles.repository';
import type { CreateRaffleDto, PublishRaffleToHeroDto, UpdateRaffleDto } from './raffles.validation';

function mapRaffleListItem(raffle: Awaited<ReturnType<typeof rafflesRepository.list>>[number]) {
  return {
    id: raffle.id,
    titleAr: raffle.titleAr,
    titleEn: raffle.titleEn,
    descriptionAr: raffle.descriptionAr,
    descriptionEn: raffle.descriptionEn,
    startsAt: raffle.startsAt,
    endsAt: raffle.endsAt,
    status: raffle.status,
    participantsCount: raffle._count.entries,
    createdAt: raffle.createdAt,
    updatedAt: raffle.updatedAt
  };
}

function mapRaffleDetail(raffle: NonNullable<Awaited<ReturnType<typeof rafflesRepository.findById>>>) {
  const now = Date.now();
  const isEnded = raffle.status === RaffleStatus.ENDED || new Date(raffle.endsAt).getTime() < now;
  const winner = raffle.entries[0] ?? null;

  return {
    id: raffle.id,
    titleAr: raffle.titleAr,
    titleEn: raffle.titleEn,
    descriptionAr: raffle.descriptionAr,
    descriptionEn: raffle.descriptionEn,
    startsAt: raffle.startsAt,
    endsAt: raffle.endsAt,
    status: raffle.status,
    isEnded,
    planPoints: raffle.planPoints.map((item) => ({
      id: item.id,
      planId: item.planId,
      points: item.points,
      plan: item.plan
    })),
    participants: raffle.entries.map((entry, index) => ({
      rank: index + 1,
      id: entry.id,
      userId: entry.userId,
      fullName: entry.user.fullName,
      email: entry.user.email,
      phone: entry.user.phone,
      totalPoints: entry.totalPoints,
      isWinner: isEnded && index === 0 && entry.totalPoints > 0,
      joinedAt: entry.createdAt
    })),
    participantsCount: raffle.entries.length,
    winner: winner
      ? {
          userId: winner.userId,
          fullName: winner.user.fullName,
          email: winner.user.email,
          totalPoints: winner.totalPoints
        }
      : null,
    hero: {
      published: Boolean(raffle.heroSlide),
      isActive: raffle.heroSlide?.isActive ?? false,
      heroSlideId: raffle.heroSlide?.id ?? null,
      platform: raffle.heroSlide?.platform ?? null,
      imageUrl: raffle.heroImageUrl ? resolveMediaUrl(raffle.heroImageUrl) : null
    }
  };
}

export class RafflesService {
  async list(includeEnded = true) {
    const rows = await rafflesRepository.list(includeEnded);
    return rows.map(mapRaffleListItem);
  }

  async getById(id: string) {
    const raffle = await rafflesRepository.findById(id);
    if (!raffle) throw new ApiError(404, 'Raffle not found');
    return mapRaffleDetail(raffle);
  }

  async create(dto: CreateRaffleDto) {
    this.assertValidPeriod(dto.startsAt, dto.endsAt);

    if (dto.status === RaffleStatus.ACTIVE) {
      const created = await rafflesRepository.create(dto);
      await rafflesRepository.deactivateOtherActiveRaffles(created.id);
      const refreshed = await rafflesRepository.findById(created.id);
      return mapRaffleDetail(refreshed!);
    }

    const created = await rafflesRepository.create(dto);
    return mapRaffleDetail(created);
  }

  async update(id: string, dto: UpdateRaffleDto) {
    const existing = await rafflesRepository.findById(id);
    if (!existing) throw new ApiError(404, 'Raffle not found');

    const startsAt = dto.startsAt ?? existing.startsAt;
    const endsAt = dto.endsAt ?? existing.endsAt;
    this.assertValidPeriod(startsAt, endsAt);

    if (dto.status === RaffleStatus.ACTIVE) {
      await rafflesRepository.deactivateOtherActiveRaffles(id);
    }

    const updated = await rafflesRepository.update(id, dto);
    return mapRaffleDetail(updated);
  }

  async delete(id: string) {
    const existing = await rafflesRepository.findById(id);
    if (!existing) throw new ApiError(404, 'Raffle not found');
    await rafflesRepository.deactivateHeroSlideForRaffle(id);
    await rafflesRepository.softDelete(id);
    return { deleted: true };
  }

  async activate(id: string) {
    const existing = await rafflesRepository.findById(id);
    if (!existing) throw new ApiError(404, 'Raffle not found');

    await rafflesRepository.deactivateOtherActiveRaffles(id);
    const updated = await rafflesRepository.setStatus(id, RaffleStatus.ACTIVE);

    if (existing.heroSlide) {
      const now = new Date();
      const isWithinPeriod = now >= updated.startsAt && now <= updated.endsAt;
      const suggestion = buildRaffleHeroSuggestion(updated);
      await rafflesRepository.upsertHeroSlideForRaffle(id, {
        imageUrl: existing.heroSlide.imageUrl,
        platform: existing.heroSlide.platform,
        titleAr: updated.titleAr,
        titleEn: updated.titleEn,
        subtitleAr: suggestion.subtitleAr,
        subtitleEn: suggestion.subtitleEn,
        buttonLabelAr: suggestion.buttonLabelAr,
        buttonLabelEn: suggestion.buttonLabelEn,
        buttonLink: suggestion.buttonLink,
        isActive: isWithinPeriod,
        sortOrder: existing.heroSlide.sortOrder
      });
    }

    const refreshed = await rafflesRepository.findById(id);
    return mapRaffleDetail(refreshed!);
  }

  async end(id: string) {
    const existing = await rafflesRepository.findById(id);
    if (!existing) throw new ApiError(404, 'Raffle not found');

    await rafflesRepository.deactivateHeroSlideForRaffle(id);
    const updated = await rafflesRepository.setStatus(id, RaffleStatus.ENDED);
    return mapRaffleDetail(updated);
  }

  getHeroPreview(id: string) {
    return this.getHeroSuggestionForRaffle(id);
  }

  async publishToHero(id: string, dto: PublishRaffleToHeroDto) {
    const raffle = await rafflesRepository.findById(id);
    if (!raffle) throw new ApiError(404, 'Raffle not found');
    if (raffle.status === RaffleStatus.ENDED) {
      throw new ApiError(400, 'Cannot publish an ended raffle to hero');
    }

    const suggestion = buildRaffleHeroSuggestion(raffle);
    const now = new Date();
    const isWithinPeriod = now >= raffle.startsAt && now <= raffle.endsAt;

    await rafflesRepository.updateHeroImageUrl(id, dto.imageUrl);
    await rafflesRepository.upsertHeroSlideForRaffle(id, {
      imageUrl: dto.imageUrl,
      platform: dto.platform ?? suggestion.platform,
      titleAr: dto.titleAr ?? suggestion.titleAr,
      titleEn: dto.titleEn ?? suggestion.titleEn,
      subtitleAr: dto.subtitleAr ?? suggestion.subtitleAr,
      subtitleEn: dto.subtitleEn ?? suggestion.subtitleEn,
      buttonLabelAr: dto.buttonLabelAr ?? suggestion.buttonLabelAr,
      buttonLabelEn: dto.buttonLabelEn ?? suggestion.buttonLabelEn,
      buttonLink: dto.buttonLink ?? suggestion.buttonLink,
      isActive: raffle.status === RaffleStatus.ACTIVE && isWithinPeriod,
      sortOrder: dto.sortOrder ?? 0
    });

    const refreshed = await rafflesRepository.findById(id);
    return mapRaffleDetail(refreshed!);
  }

  async unpublishFromHero(id: string) {
    const raffle = await rafflesRepository.findById(id);
    if (!raffle) throw new ApiError(404, 'Raffle not found');
    if (!raffle.heroSlide) throw new ApiError(404, 'Raffle is not published to hero');

    await rafflesRepository.deactivateHeroSlideForRaffle(id);
    const refreshed = await rafflesRepository.findById(id);
    return mapRaffleDetail(refreshed!);
  }

  async getActivePublic() {
    const raffle = await rafflesRepository.findActivePublic(new Date());
    if (!raffle) return null;

    return {
      id: raffle.id,
      titleAr: raffle.titleAr,
      titleEn: raffle.titleEn,
      descriptionAr: raffle.descriptionAr,
      descriptionEn: raffle.descriptionEn,
      startsAt: raffle.startsAt,
      endsAt: raffle.endsAt,
      imageUrl: raffle.heroImageUrl ? resolveMediaUrl(raffle.heroImageUrl) : null,
      planPoints: raffle.planPoints.map((item) => ({
        planId: item.planId,
        points: item.points,
        plan: item.plan
      }))
    };
  }

  private async getHeroSuggestionForRaffle(id: string) {
    const raffle = await rafflesRepository.findById(id);
    if (!raffle) throw new ApiError(404, 'Raffle not found');

    const suggestion = buildRaffleHeroSuggestion(raffle);

    return {
      ...suggestion,
      imageUrl: raffle.heroImageUrl ?? '',
      existingHeroSlideId: raffle.heroSlide?.id ?? null,
      isPublished: Boolean(raffle.heroSlide),
      isHeroActive: raffle.heroSlide?.isActive ?? false
    };
  }

  async awardPointsForPromotion(promotionId: string) {
    const promotion = await rafflesRepository.findPromotionForRaffle(promotionId);
    if (!promotion?.ad) return;

    if (Number(promotion.totalPrice) <= 0) return;

    const now = new Date();
    const raffle = await rafflesRepository.findActiveForDate(now);
    if (!raffle) return;

    const planPoints = raffle.planPoints.find((item) => item.planId === promotion.planId);
    if (!planPoints || planPoints.points <= 0) return;

    await rafflesRepository.awardPoints({
      raffleId: raffle.id,
      userId: promotion.ad.userId,
      promotionId: promotion.id,
      planId: promotion.planId,
      points: planPoints.points
    });
  }

  private assertValidPeriod(startsAt: Date, endsAt: Date) {
    if (endsAt.getTime() <= startsAt.getTime()) {
      throw new ApiError(400, 'Raffle end date must be after start date');
    }
  }
}

export const rafflesService = new RafflesService();
