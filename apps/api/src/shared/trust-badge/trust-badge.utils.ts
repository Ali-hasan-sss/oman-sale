import type { TrustBadgeStatus } from '@prisma/client';

export function isTrustBadgeApproved(status: TrustBadgeStatus | null | undefined) {
  return status === 'APPROVED';
}

export function mapTrustBadgePublic(status: TrustBadgeStatus | null | undefined) {
  return {
    trustBadgeStatus: status ?? 'NONE',
    trustBadgeApproved: isTrustBadgeApproved(status)
  };
}
