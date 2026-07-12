import axios from 'axios';

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

type ThawaniSessionResponse = {
  success: boolean;
  data?: {
    session_id: string;
    client_reference_id: string;
    payment_status?: string;
  };
  description?: string;
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
