import twilio from 'twilio';

import { env } from '../../config/env';
import { ApiError } from '../utils/api-error';
import { isTwilioConfigured } from './twilio-config';

function getTwilioClient() {
  if (!isTwilioConfigured()) {
    throw new ApiError(
      500,
      'Twilio Verify is not configured — set TWILIO_ENABLED, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_VERIFY_SERVICE_SID'
    );
  }

  return twilio(env.TWILIO_ACCOUNT_SID!, env.TWILIO_AUTH_TOKEN!);
}

function getVerifyServiceSid() {
  return env.TWILIO_VERIFY_SERVICE_SID!;
}

export type VerificationChannel = 'whatsapp' | 'sms';

function mapTwilioVerifyError(error: unknown, fallback: string) {
  const twilioError = error as { message?: string; code?: number; status?: number };
  console.error('[twilio-verify] API error', {
    message: twilioError.message,
    code: twilioError.code,
    status: twilioError.status
  });

  if (twilioError.code === 60200 || twilioError.status === 404) {
    throw new ApiError(400, 'Invalid or expired verification code');
  }

  if (twilioError.code === 60203) {
    throw new ApiError(429, 'Too many verification attempts. Please try again later.');
  }

  throw new ApiError(502, twilioError.message ?? fallback);
}

/** Ask Twilio Verify to send an OTP via WhatsApp or SMS. */
export async function startPhoneVerification(phone: string, channel: VerificationChannel = 'whatsapp') {
  const client = getTwilioClient();

  try {
    const verification = await client.verify.v2
      .services(getVerifyServiceSid())
      .verifications.create({ to: phone, channel });

    console.log('[twilio-verify] OTP requested', {
      phone,
      channel,
      sid: verification.sid,
      status: verification.status
    });

    return verification;
  } catch (error) {
    mapTwilioVerifyError(error, 'Failed to send verification code');
  }
}

/** Validate the OTP the user entered against Twilio Verify. */
export async function checkPhoneVerification(phone: string, code: string) {
  const client = getTwilioClient();

  try {
    const check = await client.verify.v2
      .services(getVerifyServiceSid())
      .verificationChecks.create({ to: phone, code });

    if (check.status !== 'approved') {
      throw new ApiError(400, 'Invalid or expired verification code');
    }

    console.log('[twilio-verify] OTP approved', { phone, sid: check.sid });
    return check;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    mapTwilioVerifyError(error, 'Failed to verify code');
  }
}
