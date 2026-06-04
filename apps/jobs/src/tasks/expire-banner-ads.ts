import { prisma } from '../lib/prisma';

/**
 * Deactivates homepage banner ads that passed their end date.
 */
export async function expireBannerAds() {
  const now = new Date();

  const expiredBanners = await prisma.heroBanner.findMany({
    where: {
      isActive: true,
      endsAt: { lt: now },
      bannerRequestId: { not: null }
    },
    select: { id: true, bannerRequestId: true }
  });

  if (expiredBanners.length === 0) return 0;

  await prisma.$transaction(async (tx) => {
    await tx.heroBanner.updateMany({
      where: { id: { in: expiredBanners.map((banner) => banner.id) } },
      data: { isActive: false }
    });

    const requestIds = expiredBanners
      .map((banner) => banner.bannerRequestId)
      .filter((id): id is string => Boolean(id));

    await tx.bannerRequest.updateMany({
      where: { id: { in: requestIds }, status: 'ACTIVE' },
      data: { status: 'EXPIRED' }
    });
  });

  return expiredBanners.length;
}
