import { env } from './config/env';
import { expireBannerAds } from './tasks/expire-banner-ads';
import { expirePromotions } from './tasks/expire-promotions';

const runPromotionExpiry = async () => {
  try {
    const count = await expirePromotions();
    console.log(`[jobs] promotion-expiry deactivated ${count} promotion(s)`);
  } catch (error) {
    console.error('[jobs] promotion-expiry failed', error);
  }
};

const runBannerAdExpiry = async () => {
  try {
    const count = await expireBannerAds();
    console.log(`[jobs] banner-ad-expiry deactivated ${count} banner ad(s)`);
  } catch (error) {
    console.error('[jobs] banner-ad-expiry failed', error);
  }
};

console.log(`[jobs] Oman Sale background jobs started (interval ${env.PROMOTION_EXPIRY_INTERVAL_MS}ms)`);

void runPromotionExpiry();
void runBannerAdExpiry();
setInterval(runPromotionExpiry, env.PROMOTION_EXPIRY_INTERVAL_MS);
setInterval(runBannerAdExpiry, env.PROMOTION_EXPIRY_INTERVAL_MS);
