import { TrustBadgeStatus } from '@prisma/client';

import { ApiError } from '../../shared/utils/api-error';
import { resolveMediaUrl } from '../../shared/utils/media-reference';
import { mapTrustBadgePublic } from '../../shared/trust-badge/trust-badge.utils';
import { trustBadgeRepository } from './trust-badge.repository';
import type {
  ListTrustBadgeQuery,
  RejectTrustBadgeDto,
  SubmitStoreTrustBadgeDto,
  SubmitUserTrustBadgeDto
} from './trust-badge.validation';

function mapUserTrustBadge<T extends {
  trustBadgeStatus: TrustBadgeStatus;
  trustIdentityDocType: string | null;
  trustIdentityDocUrl: string | null;
  trustBadgeReviewedAt: Date | null;
  trustBadgeRejectionReason: string | null;
}>(user: T) {
  return {
    ...user,
    ...mapTrustBadgePublic(user.trustBadgeStatus),
    trustIdentityDocUrl: user.trustIdentityDocUrl ? resolveMediaUrl(user.trustIdentityDocUrl) : null
  };
}

function mapStoreTrustBadge<T extends {
  trustBadgeStatus: TrustBadgeStatus;
  trustCommercialRegDocUrl: string | null;
  trustOcciDocUrl: string | null;
  trustSmeDocUrl: string | null;
  trustOtherDocUrl: string | null;
  trustOtherDocLabel: string | null;
  trustBadgeReviewedAt: Date | null;
  trustBadgeRejectionReason: string | null;
}>(store: T) {
  return {
    ...store,
    ...mapTrustBadgePublic(store.trustBadgeStatus),
    trustCommercialRegDocUrl: store.trustCommercialRegDocUrl ? resolveMediaUrl(store.trustCommercialRegDocUrl) : null,
    trustOcciDocUrl: store.trustOcciDocUrl ? resolveMediaUrl(store.trustOcciDocUrl) : null,
    trustSmeDocUrl: store.trustSmeDocUrl ? resolveMediaUrl(store.trustSmeDocUrl) : null,
    trustOtherDocUrl: store.trustOtherDocUrl ? resolveMediaUrl(store.trustOtherDocUrl) : null
  };
}

export class TrustBadgeService {
  async getUserTrustBadge(userId: string) {
    const user = await trustBadgeRepository.getUserTrustBadge(userId);
    if (!user) throw new ApiError(404, 'User not found');
    return mapUserTrustBadge(user);
  }

  async submitUserTrustBadge(userId: string, dto: SubmitUserTrustBadgeDto) {
    const user = await trustBadgeRepository.getUserTrustBadge(userId);
    if (!user) throw new ApiError(404, 'User not found');
    if (user.trustBadgeStatus === TrustBadgeStatus.PENDING) {
      throw new ApiError(409, 'Trust badge request is already pending review');
    }

    const updated = await trustBadgeRepository.submitUserTrustBadge(userId, dto);
    return mapUserTrustBadge(updated);
  }

  async getStoreTrustBadge(storeId: string, userId: string) {
    const store = await trustBadgeRepository.getStoreTrustBadge(storeId);
    if (!store) throw new ApiError(404, 'Store not found');
    if (store.userId !== userId) throw new ApiError(403, 'Only store owner can access trust badge');
    return mapStoreTrustBadge(store);
  }

  async submitStoreTrustBadge(storeId: string, userId: string, dto: SubmitStoreTrustBadgeDto) {
    const store = await trustBadgeRepository.getStoreTrustBadge(storeId);
    if (!store) throw new ApiError(404, 'Store not found');
    if (store.userId !== userId) throw new ApiError(403, 'Only store owner can submit trust badge');
    if (store.trustBadgeStatus === TrustBadgeStatus.PENDING) {
      throw new ApiError(409, 'Trust badge request is already pending review');
    }

    const updated = await trustBadgeRepository.submitStoreTrustBadge(storeId, dto);
    return mapStoreTrustBadge(updated);
  }

  listUsersForAdmin(query: ListTrustBadgeQuery) {
    return trustBadgeRepository.listUsersForAdmin(query).then((page) => ({
      ...page,
      items: page.items.map(mapUserTrustBadge)
    }));
  }

  listStoresForAdmin(query: ListTrustBadgeQuery) {
    return trustBadgeRepository.listStoresForAdmin(query).then((page) => ({
      ...page,
      items: page.items.map(mapStoreTrustBadge)
    }));
  }

  async approveUser(userId: string) {
    const user = await trustBadgeRepository.getUserTrustBadge(userId);
    if (!user) throw new ApiError(404, 'User not found');
    if (user.trustBadgeStatus !== TrustBadgeStatus.PENDING) {
      throw new ApiError(400, 'Only pending trust badge requests can be approved');
    }
    await trustBadgeRepository.approveUser(userId);
    return { approved: true };
  }

  async rejectUser(userId: string, dto: RejectTrustBadgeDto) {
    const user = await trustBadgeRepository.getUserTrustBadge(userId);
    if (!user) throw new ApiError(404, 'User not found');
    if (user.trustBadgeStatus !== TrustBadgeStatus.PENDING) {
      throw new ApiError(400, 'Only pending trust badge requests can be rejected');
    }
    await trustBadgeRepository.rejectUser(userId, dto.reason);
    return { rejected: true };
  }

  async approveStore(storeId: string) {
    const store = await trustBadgeRepository.getStoreTrustBadge(storeId);
    if (!store) throw new ApiError(404, 'Store not found');
    if (store.trustBadgeStatus !== TrustBadgeStatus.PENDING) {
      throw new ApiError(400, 'Only pending trust badge requests can be approved');
    }
    await trustBadgeRepository.approveStore(storeId);
    return { approved: true };
  }

  async rejectStore(storeId: string, dto: RejectTrustBadgeDto) {
    const store = await trustBadgeRepository.getStoreTrustBadge(storeId);
    if (!store) throw new ApiError(404, 'Store not found');
    if (store.trustBadgeStatus !== TrustBadgeStatus.PENDING) {
      throw new ApiError(400, 'Only pending trust badge requests can be rejected');
    }
    await trustBadgeRepository.rejectStore(storeId, dto.reason);
    return { rejected: true };
  }

  countPending() {
    return trustBadgeRepository.countPending();
  }
}

export const trustBadgeService = new TrustBadgeService();
