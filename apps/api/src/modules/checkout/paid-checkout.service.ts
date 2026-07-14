import { CheckoutIntentKind, PaymentProvider } from '@prisma/client';

import { env } from '../../config/env';
import {
  buildThawaniPaymentMetadata,
  createThawaniCheckoutSession,
  isThawaniConfigured,
  omrToBaisa,
  shouldSkipThawaniCheckout
} from '../../shared/payments/thawani.client';
import { ApiError } from '../../shared/utils/api-error';
import { getPlanChargeAmount } from '../../shared/utils/plan-pricing.utils';
import { usersRepository } from '../users/users.repository';
import { checkoutIntentsRepository } from './checkout-intents.repository';
import {
  materializeCheckoutIntent,
  type BannerRequestIntentPayload,
  type ListingPromotionIntentPayload,
  type StoreCreateIntentPayload
} from './checkout-intent-materialization.service';

export type PaidCheckoutResult = {
  paid: boolean;
  paymentId?: string;
  sessionId?: string;
  paymentUrl?: string;
  intentId?: string;
  result?: Record<string, string>;
};

type StartCheckoutInput = {
  userId: string;
  kind: CheckoutIntentKind;
  payload: StoreCreateIntentPayload | ListingPromotionIntentPayload | BannerRequestIntentPayload;
  amount: number;
  productName: string;
  successUrl: string;
  cancelUrl: string;
  locale?: 'ar' | 'en';
  metadataExtra?: Record<string, string | number>;
};

async function startPaidCheckout(input: StartCheckoutInput): Promise<PaidCheckoutResult> {
  if (input.amount <= 0) {
    const intent = await checkoutIntentsRepository.create({
      userId: input.userId,
      kind: input.kind,
      payload: input.payload,
      amount: input.amount
    });

    const result = await materializeCheckoutIntent({
      userId: input.userId,
      kind: input.kind,
      payload: input.payload
    });

    await checkoutIntentsRepository.markCompleted(intent.id, result);
    return { paid: true, intentId: intent.id, result };
  }

  if (shouldSkipThawaniCheckout()) {
    const intent = await checkoutIntentsRepository.create({
      userId: input.userId,
      kind: input.kind,
      payload: input.payload,
      amount: input.amount
    });

    const result = await materializeCheckoutIntent({
      userId: input.userId,
      kind: input.kind,
      payload: input.payload
    });

    await checkoutIntentsRepository.markCompleted(intent.id, result);
    return { paid: true, intentId: intent.id, result };
  }

  if (!isThawaniConfigured()) {
    throw new ApiError(503, 'Payment gateway is not configured');
  }

  const intent = await checkoutIntentsRepository.create({
    userId: input.userId,
    kind: input.kind,
    payload: input.payload,
    amount: input.amount
  });

  const chargeAmount = getPlanChargeAmount(input.amount);
  const user = await usersRepository.findById(input.userId);
  const customerName = user?.fullName ?? 'Customer';

  const { sessionId, paymentUrl } = await createThawaniCheckoutSession({
    clientReferenceId: intent.id,
    products: [
      {
        name: input.productName.slice(0, 80),
        unit_amount: omrToBaisa(chargeAmount),
        quantity: 1
      }
    ],
    successUrl: input.successUrl,
    cancelUrl: input.cancelUrl,
    metadata: buildThawaniPaymentMetadata({
      customerName,
      orderId: intent.id,
      extra: {
        'checkout kind': input.kind,
        ...(input.metadataExtra ?? {})
      }
    })
  });

  const payment = await checkoutIntentsRepository.createPaymentForIntent({
    userId: input.userId,
    intentId: intent.id,
    amount: chargeAmount,
    provider: PaymentProvider.THAWANI,
    sessionId,
    paymentUrl
  });

  return {
    paid: false,
    paymentId: payment.id,
    sessionId,
    paymentUrl,
    intentId: intent.id
  };
}

function getLocalePrefix(locale?: 'ar' | 'en') {
  return locale === 'en' ? '/en' : '/ar';
}

export async function startStoreCreateCheckout(input: {
  userId: string;
  payload: StoreCreateIntentPayload;
  storeName: string;
  locale?: 'ar' | 'en';
}) {
  const localePrefix = getLocalePrefix(input.locale);

  return startPaidCheckout({
    userId: input.userId,
    kind: CheckoutIntentKind.STORE_CREATE,
    payload: input.payload,
    amount: input.payload.subscription.finalPrice,
    productName: input.storeName,
    successUrl: `${env.WEB_URL}${localePrefix}/stores/create/success`,
    cancelUrl: `${env.WEB_URL}${localePrefix}/stores/create/cancel`,
    locale: input.locale,
    metadataExtra: { 'payment action': 'create' }
  });
}

export async function startListingPromotionCheckout(input: {
  userId: string;
  payload: ListingPromotionIntentPayload;
  adTitle: string;
  planName: string;
  totalPrice: number;
  locale?: 'ar' | 'en';
}) {
  const localePrefix = getLocalePrefix(input.locale);

  return startPaidCheckout({
    userId: input.userId,
    kind: CheckoutIntentKind.LISTING_PROMOTION,
    payload: input.payload,
    amount: input.totalPrice,
    productName: input.planName,
    successUrl: `${env.WEB_URL}${localePrefix}/listings/payment/success`,
    cancelUrl: `${env.WEB_URL}${localePrefix}/listings/payment/cancel`,
    locale: input.locale,
    metadataExtra: { 'listing title': input.adTitle.slice(0, 80) }
  });
}

export async function startBannerRequestCheckout(input: {
  userId: string;
  payload: BannerRequestIntentPayload;
  locale?: 'ar' | 'en';
}) {
  const localePrefix = getLocalePrefix(input.locale);

  return startPaidCheckout({
    userId: input.userId,
    kind: CheckoutIntentKind.BANNER_REQUEST,
    payload: input.payload,
    amount: input.payload.totalPrice,
    productName: 'Homepage banner ad',
    successUrl: `${env.WEB_URL}${localePrefix}/banner-ad/success`,
    cancelUrl: `${env.WEB_URL}${localePrefix}/banner-ad/cancel`,
    locale: input.locale,
    metadataExtra: { 'service type': 'banner ad' }
  });
}
