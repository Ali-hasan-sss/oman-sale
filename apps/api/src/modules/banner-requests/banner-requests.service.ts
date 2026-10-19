import { BannerPlacement, BannerRequestStatus } from '@prisma/client';

import { DEFAULT_BANNER_PLACEMENT } from '../banners/banner-placements';
import { ApiError } from '../../shared/utils/api-error';
import { resolveMediaUrl } from '../../shared/utils/media-reference';
import type { BannerRequestIntentPayload } from '../checkout/checkout-intent-materialization.service';
import { startBannerRequestCheckout } from '../checkout/paid-checkout.service';
import { cancelThawaniBannerPayment, confirmThawaniBannerPayment } from './banner-checkout.service';
import { bannerRequestsRepository } from './banner-requests.repository';
import type {
  CreateBannerRequestInput,
  ListBannerRequestsQuery,
  RejectBannerRequestInput,
  UpdateBannerPricingInput
} from './banner-requests.validation';

const mapRequest = (request: NonNullable<Awaited<ReturnType<typeof bannerRequestsRepository.findById>>>) => ({
  id: request.id,
  userId: request.userId,
  user: request.user,
  imageUrl: resolveMediaUrl(request.imageUrl),
  linkUrl: request.linkUrl,
  textAr: request.textAr,
  textEn: request.textEn,
  placement: request.placement,
  durationDays: request.durationDays,
  totalPrice: Number(request.totalPrice),
  status: request.status,
  rejectionReason: request.rejectionReason,
  startsAt: request.startsAt,
  endsAt: request.endsAt,
  approvedAt: request.approvedAt,
  payment: request.payment
    ? {
        id: request.payment.id,
        status: request.payment.status,
        amount: Number(request.payment.amount),
        paymentUrl: request.payment.paymentUrl
      }
    : null,
  heroBannerId: request.heroBanner?.id ?? null,
  createdAt: request.createdAt,
  updatedAt: request.updatedAt
});

export class BannerRequestsService {
  async getPricing(placement: BannerPlacement = DEFAULT_BANNER_PLACEMENT) {
    const pricing = await bannerRequestsRepository.getPricingByPlacement(placement);
    if (!pricing) {
      throw new ApiError(404, 'Banner pricing is not configured');
    }

    return {
      id: pricing.id,
      placement: pricing.placement,
      pricePerDay: Number(pricing.pricePerDay),
      minDays: pricing.minDays,
      maxDays: pricing.maxDays,
      isActive: pricing.isActive,
      titleAr: pricing.titleAr,
      titleEn: pricing.titleEn,
      subtitleAr: pricing.subtitleAr,
      subtitleEn: pricing.subtitleEn
    };
  }

  async quotePrice(durationDays: number, placement: BannerPlacement = DEFAULT_BANNER_PLACEMENT) {
    const pricing = await this.getPricing(placement);
    if (!pricing.isActive) {
      throw new ApiError(400, 'Banner advertising is not available for this placement');
    }
    if (durationDays < pricing.minDays || durationDays > pricing.maxDays) {
      throw new ApiError(400, `Duration must be between ${pricing.minDays} and ${pricing.maxDays} days`);
    }

    return {
      placement: pricing.placement,
      durationDays,
      pricePerDay: pricing.pricePerDay,
      totalPrice: Number((pricing.pricePerDay * durationDays).toFixed(3))
    };
  }

  async updatePricing(input: UpdateBannerPricingInput) {
    const placement = input.placement ?? DEFAULT_BANNER_PLACEMENT;
    const pricing = await bannerRequestsRepository.getPricingByPlacement(placement);
    const minDays = input.minDays ?? pricing?.minDays ?? 1;
    const maxDays = input.maxDays ?? pricing?.maxDays ?? 90;
    if (minDays > maxDays) {
      throw new ApiError(400, 'Minimum days cannot exceed maximum days');
    }

    const updated = await bannerRequestsRepository.upsertPricing(placement, {
      pricePerDay: input.pricePerDay,
      minDays,
      maxDays,
      isActive: input.isActive ?? pricing?.isActive ?? true,
      titleAr: input.titleAr === undefined ? pricing?.titleAr ?? null : input.titleAr || null,
      titleEn: input.titleEn === undefined ? pricing?.titleEn ?? null : input.titleEn || null,
      subtitleAr: input.subtitleAr === undefined ? pricing?.subtitleAr ?? null : input.subtitleAr || null,
      subtitleEn: input.subtitleEn === undefined ? pricing?.subtitleEn ?? null : input.subtitleEn || null
    });

    return {
      id: updated.id,
      placement: updated.placement,
      pricePerDay: Number(updated.pricePerDay),
      minDays: updated.minDays,
      maxDays: updated.maxDays,
      isActive: updated.isActive,
      titleAr: updated.titleAr,
      titleEn: updated.titleEn,
      subtitleAr: updated.subtitleAr,
      subtitleEn: updated.subtitleEn
    };
  }

  async createRequest(userId: string, input: CreateBannerRequestInput, locale?: 'ar' | 'en') {
    const placement = input.placement ?? DEFAULT_BANNER_PLACEMENT;
    const quote = await this.quotePrice(input.durationDays, placement);

    const payload: BannerRequestIntentPayload = {
      placement,
      imageUrl: input.imageUrl.trim(),
      linkUrl: input.linkUrl.trim(),
      textAr: input.textAr?.trim() || null,
      textEn: input.textEn?.trim() || null,
      durationDays: input.durationDays,
      totalPrice: quote.totalPrice
    };

    const checkout = await startBannerRequestCheckout({ userId, payload, locale });

    if (checkout.paid && checkout.result?.bannerRequestId) {
      const fullRequest = await bannerRequestsRepository.findById(checkout.result.bannerRequestId);
      if (!fullRequest) throw new ApiError(500, 'Failed to create banner request');
      return {
        request: mapRequest(fullRequest),
        checkout: { paid: true }
      };
    }

    return {
      checkout: {
        paid: false,
        paymentUrl: checkout.paymentUrl,
        sessionId: checkout.sessionId
      }
    };
  }

  async listMine(userId: string) {
    const requests = await bannerRequestsRepository.listForUser(userId);
    return requests.map((request) => mapRequest(request as NonNullable<Awaited<ReturnType<typeof bannerRequestsRepository.findById>>>));
  }

  async listForAdmin(query: ListBannerRequestsQuery = {}) {
    const requests = await bannerRequestsRepository.listForAdmin(query.status, query.placement);
    return requests.map((request) => mapRequest(request as NonNullable<Awaited<ReturnType<typeof bannerRequestsRepository.findById>>>));
  }

  async approve(id: string) {
    const request = await bannerRequestsRepository.findById(id);
    if (!request) throw new ApiError(404, 'Banner request not found');
    if (request.status !== BannerRequestStatus.PENDING_APPROVAL) {
      throw new ApiError(400, 'Only pending approval requests can be approved');
    }

    const startsAt = new Date();
    const endsAt = new Date(startsAt.getTime() + request.durationDays * 24 * 60 * 60 * 1000);

    const result = await bannerRequestsRepository.approveRequest({
      requestId: request.id,
      placement: request.placement,
      imageUrl: request.imageUrl,
      linkUrl: request.linkUrl,
      textAr: request.textAr,
      textEn: request.textEn,
      startsAt,
      endsAt
    });

    return {
      banner: result.banner,
      request: mapRequest(result.request as NonNullable<Awaited<ReturnType<typeof bannerRequestsRepository.findById>>>)
    };
  }

  async reject(id: string, input: RejectBannerRequestInput) {
    const request = await bannerRequestsRepository.findById(id);
    if (!request) throw new ApiError(404, 'Banner request not found');
    if (request.status !== BannerRequestStatus.PENDING_APPROVAL) {
      throw new ApiError(400, 'Only pending approval requests can be rejected');
    }

    const updated = await bannerRequestsRepository.updateStatus(id, {
      status: BannerRequestStatus.REJECTED,
      rejectionReason: input.reason.trim()
    });

    const fullRequest = await bannerRequestsRepository.findById(updated.id);
    if (!fullRequest) throw new ApiError(500, 'Failed to reject banner request');
    return mapRequest(fullRequest);
  }

  async confirmPayment(userId: string, sessionId: string) {
    const result = await confirmThawaniBannerPayment(userId, sessionId);
    return {
      payment: result.payment,
      request: result.request ? mapRequest(result.request) : null,
      alreadyPaid: result.alreadyPaid
    };
  }

  async cancelPayment(userId: string, sessionId: string) {
    return cancelThawaniBannerPayment(userId, sessionId);
  }
}

export const bannerRequestsService = new BannerRequestsService();
