import { env } from './config/env';
import { expirePromotions } from './tasks/expire-promotions';

const runPromotionExpiry = async () => {
  try {
    const count = await expirePromotions();
    console.log(`[jobs] promotion-expiry deactivated ${count} promotion(s)`);
  } catch (error) {
    console.error('[jobs] promotion-expiry failed', error);
  }
};

console.log(`[jobs] Oman Sale background jobs started (interval ${env.PROMOTION_EXPIRY_INTERVAL_MS}ms)`);

void runPromotionExpiry();
setInterval(runPromotionExpiry, env.PROMOTION_EXPIRY_INTERVAL_MS);
