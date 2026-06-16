import { env } from '../../config/env';

export function isWhatsAppConfigured() {
  return Boolean(env.WHATSAPP_ENABLED && env.WHATSAPP_PHONE_NUMBER_ID && env.WHATSAPP_ACCESS_TOKEN);
}

export function getWhatsAppApiBaseUrl() {
  return `https://graph.facebook.com/${env.WHATSAPP_API_VERSION}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
}
