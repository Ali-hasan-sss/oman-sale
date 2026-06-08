import { BannerRequestStatus } from '@prisma/client';

import { ApiError } from '../../shared/utils/api-error';
import { resolveMediaUrl } from '../../shared/utils/media-reference';
import { checkoutBannerRequest, confirmThawaniBannerPayment } from './banner-checkout.service';
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
  async getPricing() {
    const pricing = await bannerRequestsRepository.getActivePricing();
    if (!pricing) {
      throw new ApiError(404, 'Banner pricing is not configured');
    }

    return {
      id: pricing.id,
      pricePerDay: Number(pricing.pricePerDay),
      minDays: pricing.minDays,
      maxDays: pricing.maxDays,
      isActive: pricing.isActive
    };
  }

  async quotePrice(durationDays: number) {
    const pricing = await this.getPricing();
    if (durationDays < pricing.minDays || durationDays > pricing.maxDays) {
      throw new ApiError(400, `Duration must be between ${pricing.minDays} and ${pricing.maxDays} days`);
    }

    return {
      durationDays,
      pricePerDay: pricing.pricePerDay,
      totalPrice: Number((pricing.pricePerDay * durationDays).toFixed(3))
    };
  }

  async updatePricing(input: UpdateBannerPricingInput) {
    const pricing = await bannerRequestsRepository.getActivePricing();
    if (!pricing) {
      throw new ApiError(404, 'Banner pricing is not configured');
    }

    const minDays = input.minDays ?? pricing.minDays;
    const maxDays = input.maxDays ?? pricing.maxDays;
    if (minDays > maxDays) {
      throw new ApiError(400, 'Minimum days cannot exceed maximum days');
    }

    const updated = await bannerRequestsRepository.updatePricing(pricing.id, {
      pricePerDay: input.pricePerDay,
      minDays,
      maxDays,
      isActive: input.isActive
    });

    return {
      id: updated.id,
      pricePerDay: Number(updated.pricePerDay),
      minDays: updated.minDays,
      maxDays: updated.maxDays,
      isActive: updated.isActive
    };
  }

  async createRequest(userId: string, input: CreateBannerRequestInput, locale?: 'ar' | 'en') {
    const quote = await this.quotePrice(input.durationDays);

    const request = await bannerRequestsRepository.createRequest({
      userId,
      imageUrl: input.imageUrl.trim(),
      linkUrl: input.linkUrl.trim(),
      textAr: input.textAr?.trim() || null,
      textEn: input.textEn?.trim() || null,
      durationDays: input.durationDays,
      totalPrice: quote.totalPrice,
      status: BannerRequestStatus.PENDING_PAYMENT
    });

    const checkout = await checkoutBannerRequest({
      userId,
      requestId: request.id,
      totalPrice: quote.totalPrice,
      locale
    });

    const fullRequest = await bannerRequestsRepository.findById(request.id);
    if (!fullRequest) throw new ApiError(500, 'Failed to create banner request');

    return {
      request: mapRequest(fullRequest),
      checkout
    };
  }

  async listMine(userId: string) {
    const requests = await bannerRequestsRepository.listForUser(userId);
    return requests.map((request) => mapRequest(request as NonNullable<Awaited<ReturnType<typeof bannerRequestsRepository.findById>>>));
  }

  async listForAdmin(query: ListBannerRequestsQuery = {}) {
    const requests = await bannerRequestsRepository.listForAdmin(query.status);
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
}

export const bannerRequestsService = new BannerRequestsService();
