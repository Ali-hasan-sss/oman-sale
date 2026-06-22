import { env } from '../../config/env';

export function isTwilioConfigured() {
  return Boolean(
    env.TWILIO_ENABLED && env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_VERIFY_SERVICE_SID
  );
}
