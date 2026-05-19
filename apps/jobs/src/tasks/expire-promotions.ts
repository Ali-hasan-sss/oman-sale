import { prisma } from '../lib/prisma';

/**
 * Deactivates paid promotions that passed their end date.
 * The listing (Ad) stays published; only promotion visibility ends.
 */
export async function expirePromotions() {
  const now = new Date();

  const result = await prisma.adPromotion.updateMany({
    where: {
      isActive: true,
      deletedAt: null,
      endsAt: { lt: now }
    },
    data: { isActive: false }
  });

  return result.count;
}
