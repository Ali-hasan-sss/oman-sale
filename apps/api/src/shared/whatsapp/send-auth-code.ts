import { env } from '../../config/env';
import { notificationQueue } from '../../config/queues';
import { ApiError } from '../utils/api-error';
import { isWhatsAppConfigured } from './whatsapp-config';

type Locale = 'ar' | 'en';

export async function sendAuthCodeWhatsApp(phone: string, code: string, locale: Locale) {
  if (env.PHONE_SKIP_VERIFY) return;

  if (!env.WHATSAPP_ENABLED) {
    console.warn('[whatsapp] WHATSAPP_ENABLED=false — OTP was not queued. Enable after Meta setup.');
    return;
  }

  if (!isWhatsAppConfigured()) {
    throw new ApiError(
      500,
      'WhatsApp is enabled but missing WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN'
    );
  }

  try {
    await notificationQueue.add('deliver-whatsapp-auth-code', { phone, code, locale });
  } catch (error) {
    console.error('[whatsapp] failed to queue auth code', { phone, error });
    throw new ApiError(500, 'Failed to queue WhatsApp verification message');
  }

  console.log('[whatsapp] auth code queued', {
    phone,
    code: env.NODE_ENV === 'development' ? code : '******'
  });
}
