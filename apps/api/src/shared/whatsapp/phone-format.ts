/** Converts E.164 (+96891234567) to WhatsApp API format (96891234567). */
export function formatPhoneForWhatsApp(phone: string) {
  return phone.replace(/[^\d]/g, '');
}
