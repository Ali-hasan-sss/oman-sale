import { TrustBadgeStatus } from '@prisma/client';

import { prisma } from '../../shared/prisma/client';
import type { ListTrustBadgeQuery } from './trust-badge.validation';

export class TrustBadgeRepository {
  getUserTrustBadge(userId: string) {
    return prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        fullName: true,
        email: true,
        trustBadgeStatus: true,
        trustIdentityDocType: true,
        trustIdentityDocUrl: true,
        trustBadgeReviewedAt: true,
        trustBadgeRejectionReason: true
      }
    });
  }

  submitUserTrustBadge(
    userId: string,
    data: { documentType: 'NATIONAL_ID' | 'PASSPORT'; documentUrl: string }
  ) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        trustBadgeStatus: TrustBadgeStatus.PENDING,
        trustIdentityDocType: data.documentType,
        trustIdentityDocUrl: data.documentUrl,
        trustBadgeReviewedAt: null,
        trustBadgeRejectionReason: null
      },
      select: {
        id: true,
        trustBadgeStatus: true,
        trustIdentityDocType: true,
        trustIdentityDocUrl: true,
        trustBadgeReviewedAt: true,
        trustBadgeRejectionReason: true
      }
    });
  }

  getStoreTrustBadge(storeId: string) {
    return prisma.store.findFirst({
      where: { id: storeId, deletedAt: null },
      select: {
        id: true,
        userId: true,
        nameAr: true,
        nameEn: true,
        trustBadgeStatus: true,
        trustCommercialRegDocUrl: true,
        trustOcciDocUrl: true,
        trustSmeDocUrl: true,
        trustOtherDocUrl: true,
        trustOtherDocLabel: true,
        trustBadgeReviewedAt: true,
        trustBadgeRejectionReason: true
      }
    });
  }

  submitStoreTrustBadge(
    storeId: string,
    data: {
      commercialRegDocUrl: string;
      occiDocUrl?: string;
      smeDocUrl?: string;
      otherDocUrl?: string;
      otherDocLabel?: string;
    }
  ) {
    return prisma.store.update({
      where: { id: storeId },
      data: {
        trustBadgeStatus: TrustBadgeStatus.PENDING,
        trustCommercialRegDocUrl: data.commercialRegDocUrl,
        trustOcciDocUrl: data.occiDocUrl ?? null,
        trustSmeDocUrl: data.smeDocUrl ?? null,
        trustOtherDocUrl: data.otherDocUrl ?? null,
        trustOtherDocLabel: data.otherDocLabel?.trim() || null,
        trustBadgeReviewedAt: null,
        trustBadgeRejectionReason: null
      },
      select: {
        id: true,
        trustBadgeStatus: true,
        trustCommercialRegDocUrl: true,
        trustOcciDocUrl: true,
        trustSmeDocUrl: true,
        trustOtherDocUrl: true,
        trustOtherDocLabel: true,
        trustBadgeReviewedAt: true,
        trustBadgeRejectionReason: true
      }
    });
  }

  listUsersForAdmin(query: ListTrustBadgeQuery) {
    const skip = (query.page - 1) * query.limit;
    const where = { deletedAt: null, trustBadgeStatus: query.status as TrustBadgeStatus };

    return Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          avatar: true,
          trustBadgeStatus: true,
          trustIdentityDocType: true,
          trustIdentityDocUrl: true,
          trustBadgeReviewedAt: true,
          trustBadgeRejectionReason: true,
          updatedAt: true
        }
      }),
      prisma.user.count({ where })
    ]).then(([items, total]) => ({ items, total, page: query.page, limit: query.limit }));
  }

  listStoresForAdmin(query: ListTrustBadgeQuery) {
    const skip = (query.page - 1) * query.limit;
    const where = { deletedAt: null, trustBadgeStatus: query.status as TrustBadgeStatus };

    return Promise.all([
      prisma.store.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          slug: true,
          nameAr: true,
          nameEn: true,
          logoUrl: true,
          trustBadgeStatus: true,
          trustCommercialRegDocUrl: true,
          trustOcciDocUrl: true,
          trustSmeDocUrl: true,
          trustOtherDocUrl: true,
          trustOtherDocLabel: true,
          trustBadgeReviewedAt: true,
          trustBadgeRejectionReason: true,
          updatedAt: true,
          user: { select: { id: true, fullName: true, email: true, phone: true, avatar: true } }
        }
      }),
      prisma.store.count({ where })
    ]).then(([items, total]) => ({ items, total, page: query.page, limit: query.limit }));
  }

  approveUser(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        trustBadgeStatus: TrustBadgeStatus.APPROVED,
        trustBadgeReviewedAt: new Date(),
        trustBadgeRejectionReason: null
      }
    });
  }

  rejectUser(userId: string, reason: string) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        trustBadgeStatus: TrustBadgeStatus.REJECTED,
        trustBadgeReviewedAt: new Date(),
        trustBadgeRejectionReason: reason
      }
    });
  }

  approveStore(storeId: string) {
    return prisma.store.update({
      where: { id: storeId },
      data: {
        trustBadgeStatus: TrustBadgeStatus.APPROVED,
        trustBadgeReviewedAt: new Date(),
        trustBadgeRejectionReason: null
      }
    });
  }

  rejectStore(storeId: string, reason: string) {
    return prisma.store.update({
      where: { id: storeId },
      data: {
        trustBadgeStatus: TrustBadgeStatus.REJECTED,
        trustBadgeReviewedAt: new Date(),
        trustBadgeRejectionReason: reason
      }
    });
  }

  countPending() {
    return Promise.all([
      prisma.user.count({ where: { deletedAt: null, trustBadgeStatus: TrustBadgeStatus.PENDING } }),
      prisma.store.count({ where: { deletedAt: null, trustBadgeStatus: TrustBadgeStatus.PENDING } })
    ]).then(([users, stores]) => ({ users, stores, total: users + stores }));
  }
}

export const trustBadgeRepository = new TrustBadgeRepository();
