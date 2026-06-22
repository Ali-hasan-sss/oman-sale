import { env } from '../../config/env';
import { notificationQueue } from '../../config/queues';
import { ApiError } from '../utils/api-error';
import { isTwilioConfigured } from './twilio-config';
import type { VerificationChannel } from './twilio-verify-client';

type Locale = 'ar' | 'en';

/** Queue a Twilio Verify OTP request (Twilio generates and sends the code). */
export async function requestPhoneVerification(
  phone: string,
  _locale: Locale,
  channel: VerificationChannel = 'whatsapp'
) {
  if (env.PHONE_SKIP_VERIFY) return;

  if (!env.TWILIO_ENABLED) {
    console.warn('[twilio-verify] TWILIO_ENABLED=false — OTP was not queued.');
    return;
  }

  if (!isTwilioConfigured()) {
    throw new ApiError(
      500,
      'Twilio Verify is enabled but missing TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_VERIFY_SERVICE_SID'
    );
  }

  try {
    await notificationQueue.add('start-twilio-verify', { phone, channel });
  } catch (error) {
    console.error('[twilio-verify] failed to queue verification', { phone, error });
    throw new ApiError(500, 'Failed to queue phone verification');
  }

  console.log('[twilio-verify] verification queued', { phone, channel });
}
