import { NotificationType, TrustBadgeStatus } from '@prisma/client';

import { ApiError } from '../../shared/utils/api-error';
import { resolveMediaUrl } from '../../shared/utils/media-reference';
import { mapTrustBadgePublic } from '../../shared/trust-badge/trust-badge.utils';
import { sendAdminNotification } from '../notifications/send-admin-notification';
import { sendUserNotification } from '../notifications/send-user-notification';
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
    await sendAdminNotification({
      type: NotificationType.ADMIN_TRUST_BADGE_REQUEST,
      title: { ar: 'طلب توثيق حساب جديد', en: 'New account verification request' },
      body: {
        ar: `المستخدم "${user.fullName}" قدّم طلب توثيق حساب.`,
        en: `User "${user.fullName}" submitted an account verification request.`
      },
      metadata: { userId, kind: 'user' }
    }).catch(() => undefined);
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
    await sendAdminNotification({
      type: NotificationType.ADMIN_TRUST_BADGE_REQUEST,
      title: { ar: 'طلب توثيق متجر جديد', en: 'New store verification request' },
      body: {
        ar: `متجر "${store.nameAr}" قدّم طلب توثيق.`,
        en: `Store "${store.nameEn}" submitted a verification request.`
      },
      metadata: { storeId, kind: 'store' }
    }).catch(() => undefined);
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
    await sendUserNotification({
      userId,
      type: NotificationType.TRUST_BADGE_APPROVED,
      title: { ar: 'تم قبول توثيق حسابك', en: 'Account verification approved' },
      body: {
        ar: 'تهانينا! تم قبول طلب توثيق حسابك. سيظهر شارة التوثيق على ملفك.',
        en: 'Congratulations! Your account verification was approved. The verified badge will appear on your profile.'
      },
      channels: { inApp: true, email: true, whatsapp: false, push: true }
    }).catch(() => undefined);
    return { approved: true };
  }

  async rejectUser(userId: string, dto: RejectTrustBadgeDto) {
    const user = await trustBadgeRepository.getUserTrustBadge(userId);
    if (!user) throw new ApiError(404, 'User not found');
    if (user.trustBadgeStatus !== TrustBadgeStatus.PENDING) {
      throw new ApiError(400, 'Only pending trust badge requests can be rejected');
    }
    await trustBadgeRepository.rejectUser(userId, dto.reason);
    await sendUserNotification({
      userId,
      type: NotificationType.TRUST_BADGE_REJECTED,
      title: { ar: 'تم رفض طلب توثيق حسابك', en: 'Account verification rejected' },
      body: {
        ar: `تم رفض طلب توثيق حسابك. السبب: ${dto.reason}`,
        en: `Your account verification request was rejected. Reason: ${dto.reason}`
      },
      metadata: { reason: dto.reason },
      channels: { inApp: true, email: true, whatsapp: false, push: true }
    }).catch(() => undefined);
    return { rejected: true };
  }

  async approveStore(storeId: string) {
    const store = await trustBadgeRepository.getStoreTrustBadge(storeId);
    if (!store) throw new ApiError(404, 'Store not found');
    if (store.trustBadgeStatus !== TrustBadgeStatus.PENDING) {
      throw new ApiError(400, 'Only pending trust badge requests can be approved');
    }
    await trustBadgeRepository.approveStore(storeId);
    await sendUserNotification({
      userId: store.userId,
      type: NotificationType.TRUST_BADGE_APPROVED,
      title: { ar: 'تم قبول توثيق متجرك', en: 'Store verification approved' },
      body: {
        ar: `تهانينا! تم قبول توثيق متجر "${store.nameAr}".`,
        en: `Congratulations! Verification for store "${store.nameEn}" was approved.`
      },
      metadata: { storeId },
      channels: { inApp: true, email: true, whatsapp: false, push: true }
    }).catch(() => undefined);
    return { approved: true };
  }

  async rejectStore(storeId: string, dto: RejectTrustBadgeDto) {
    const store = await trustBadgeRepository.getStoreTrustBadge(storeId);
    if (!store) throw new ApiError(404, 'Store not found');
    if (store.trustBadgeStatus !== TrustBadgeStatus.PENDING) {
      throw new ApiError(400, 'Only pending trust badge requests can be rejected');
    }
    await trustBadgeRepository.rejectStore(storeId, dto.reason);
    await sendUserNotification({
      userId: store.userId,
      type: NotificationType.TRUST_BADGE_REJECTED,
      title: { ar: 'تم رفض توثيق متجرك', en: 'Store verification rejected' },
      body: {
        ar: `تم رفض توثيق متجر "${store.nameAr}". السبب: ${dto.reason}`,
        en: `Verification for store "${store.nameEn}" was rejected. Reason: ${dto.reason}`
      },
      metadata: { storeId, reason: dto.reason },
      channels: { inApp: true, email: true, whatsapp: false, push: true }
    }).catch(() => undefined);
    return { rejected: true };
  }

  countPending() {
    return trustBadgeRepository.countPending();
  }
}

export const trustBadgeService = new TrustBadgeService();
