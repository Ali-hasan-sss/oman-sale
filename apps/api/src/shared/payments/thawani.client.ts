import axios from 'axios';
import { createHmac, timingSafeEqual } from 'node:crypto';

import { env } from '../../config/env';

type ThawaniProduct = {
  name: string;
  unit_amount: number;
  quantity: number;
};

type CreateCheckoutSessionInput = {
  clientReferenceId: string;
  products: ThawaniProduct[];
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string | number>;
};

export type ThawaniSessionResponse = {
  success: boolean;
  data?: {
    session_id: string;
    client_reference_id: string;
    payment_status?: string;
    metadata?: Record<string, string | number>;
  };
  description?: string;
};

export type ThawaniWebhookEvent = {
  event_type: string;
  data?: {
    session_id?: string;
    payment_status?: string;
    client_reference_id?: string;
    metadata?: Record<string, string | number>;
  };
};

const getBaseUrl = () => (env.THAWANI_SANDBOX ? 'https://uatcheckout.thawani.om/api/v1' : 'https://checkout.thawani.om/api/v1');

const getCheckoutBaseUrl = () => (env.THAWANI_SANDBOX ? 'https://uatcheckout.thawani.om' : 'https://checkout.thawani.om');

export function isThawaniConfigured() {
  return Boolean(env.THAWANI_SECRET_KEY && env.THAWANI_PUBLISHABLE_KEY);
}

export function shouldSkipThawaniCheckout() {
  if (env.THAWANI_SKIP_CHECKOUT) return true;
  return env.NODE_ENV === 'development' && !isThawaniConfigured();
}

export function omrToBaisa(amount: number) {
  return Math.round(amount * 1000);
}

export function buildThawaniPaymentMetadata(input: {
  customerName: string;
  orderId: string;
  extra?: Record<string, string | number>;
}) {
  return {
    'Customer name': input.customerName.trim() || 'Customer',
    'order id': input.orderId,
    ...(input.extra ?? {})
  };
}

export function verifyThawaniWebhookSignature(rawBody: string, timestamp: string, signature: string) {
  if (!env.THAWANI_WEBHOOK_SECRET) return false;

  const expected = createHmac('sha256', env.THAWANI_WEBHOOK_SECRET)
    .update(`${rawBody}-${timestamp}`)
    .digest('hex');

  const expectedBuffer = Buffer.from(expected, 'hex');
  const receivedBuffer = Buffer.from(signature, 'hex');

  if (expectedBuffer.length !== receivedBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

export async function createThawaniCheckoutSession(input: CreateCheckoutSessionInput) {
  if (!env.THAWANI_SECRET_KEY || !env.THAWANI_PUBLISHABLE_KEY) {
    throw new Error('Thawani is not configured');
  }

  const response = await axios.post<ThawaniSessionResponse>(
    `${getBaseUrl()}/checkout/session`,
    {
      client_reference_id: input.clientReferenceId,
      mode: 'payment',
      products: input.products,
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      metadata: input.metadata
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'thawani-api-key': env.THAWANI_SECRET_KEY
      }
    }
  );

  if (!response.data.success || !response.data.data?.session_id) {
    throw new Error(response.data.description ?? 'Failed to create Thawani checkout session');
  }

  const sessionId = response.data.data.session_id;
  const paymentUrl = `${getCheckoutBaseUrl()}/pay/${sessionId}?key=${env.THAWANI_PUBLISHABLE_KEY}`;

  return { sessionId, paymentUrl };
}

export async function retrieveThawaniCheckoutSession(sessionId: string) {
  if (!env.THAWANI_SECRET_KEY) {
    throw new Error('Thawani is not configured');
  }

  const response = await axios.get<ThawaniSessionResponse>(`${getBaseUrl()}/checkout/session/${sessionId}`, {
    headers: {
      'thawani-api-key': env.THAWANI_SECRET_KEY
    }
  });

  return response.data;
}

export function isThawaniSessionPaid(session: ThawaniSessionResponse) {
  return session.success && session.data?.payment_status === 'paid';
}

export function getThawaniWebhookUrl() {
  const base = env.API_URL.replace(/\/$/, '');
  return `${base}/api/v1/payments/thawani/webhook`;
}
