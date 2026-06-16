import { env } from '../../config/env';
import { ApiError } from '../utils/api-error';
import { formatPhoneForWhatsApp } from './phone-format';
import { getWhatsAppApiBaseUrl, isWhatsAppConfigured } from './whatsapp-config';

type WhatsAppGraphError = {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
};

type SendOtpTemplateInput = {
  phone: string;
  code: string;
  locale?: 'ar' | 'en';
};

function buildOtpTemplatePayload(phone: string, code: string, locale: 'ar' | 'en') {
  const languageCode = locale === 'en' && env.WHATSAPP_OTP_TEMPLATE_LANGUAGE_EN
    ? env.WHATSAPP_OTP_TEMPLATE_LANGUAGE_EN
    : env.WHATSAPP_OTP_TEMPLATE_LANGUAGE;

  const components: Array<Record<string, unknown>> = [
    {
      type: 'body',
      parameters: [{ type: 'text', text: code }]
    }
  ];

  if (env.WHATSAPP_OTP_TEMPLATE_HAS_BUTTON) {
    components.push({
      type: 'button',
      sub_type: 'url',
      index: '0',
      parameters: [{ type: 'text', text: code }]
    });
  }

  return {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: formatPhoneForWhatsApp(phone),
    type: 'template',
    template: {
      name: env.WHATSAPP_OTP_TEMPLATE_NAME,
      language: { code: languageCode },
      components
    }
  };
}

async function postWhatsAppMessage(payload: Record<string, unknown>) {
  if (!isWhatsAppConfigured()) {
    throw new ApiError(500, 'WhatsApp is not configured');
  }

  const response = await fetch(getWhatsAppApiBaseUrl(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = (await response.json().catch(() => ({}))) as WhatsAppGraphError & {
    messages?: Array<{ id: string }>;
  };

  if (!response.ok) {
    const message = data.error?.message ?? 'WhatsApp API request failed';
    console.error('[whatsapp] Graph API error', {
      status: response.status,
      message,
      code: data.error?.code,
      subcode: data.error?.error_subcode,
      fbtrace_id: data.error?.fbtrace_id
    });
    throw new ApiError(502, message);
  }

  return data;
}

export async function sendWhatsAppOtpTemplate({ phone, code, locale = 'ar' }: SendOtpTemplateInput) {
  const payload = buildOtpTemplatePayload(phone, code, locale);
  const result = await postWhatsAppMessage(payload);
  console.log('[whatsapp] OTP sent', {
    phone: formatPhoneForWhatsApp(phone),
    messageId: result.messages?.[0]?.id
  });
  return result;
}

type SendNotificationTemplateInput = {
  phone: string;
  templateName: string;
  languageCode: string;
  bodyParameters?: string[];
};

export async function sendWhatsAppNotificationTemplate({
  phone,
  templateName,
  languageCode,
  bodyParameters = []
}: SendNotificationTemplateInput) {
  const components =
    bodyParameters.length > 0
      ? [
          {
            type: 'body',
            parameters: bodyParameters.map((text) => ({ type: 'text', text }))
          }
        ]
      : undefined;

  const payload: Record<string, unknown> = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: formatPhoneForWhatsApp(phone),
    type: 'template',
    template: {
      name: templateName,
      language: { code: languageCode },
      ...(components ? { components } : {})
    }
  };

  return postWhatsAppMessage(payload);
}
