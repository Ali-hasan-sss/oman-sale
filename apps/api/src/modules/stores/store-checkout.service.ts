import { PaymentProvider, PaymentStatus } from '@prisma/client';

import { env } from '../../config/env';
import {
  createThawaniCheckoutSession,
  isThawaniConfigured,
  omrToBaisa,
  shouldSkipThawaniCheckout
} from '../../shared/payments/thawani.client';
import { ApiError } from '../../shared/utils/api-error';
import { activateStoreSubscription } from './store-subscription.utils';
import { getPlanChargeAmount } from '../../shared/utils/plan-pricing.utils';
import { storesRepository } from './stores.repository';

type CheckoutInput = {
  userId: string;
  subscriptionId: string;
  storeName: string;
  finalPrice: number;
  locale?: 'ar' | 'en';
};

export type StoreCheckoutResult = {
  activated: boolean;
  paymentId?: string;
  sessionId?: string;
  paymentUrl?: string;
};

export async function checkoutStoreSubscription(input: CheckoutInput): Promise<StoreCheckoutResult> {
  if (input.finalPrice <= 0) {
    await activateStoreSubscription(input.subscriptionId);
    return { activated: true };
  }

  if (!isThawaniConfigured()) {
    throw new ApiError(503, 'Payment gateway is not configured');
  }

  const localePrefix = input.locale === 'en' ? '/en' : '/ar';
  const successUrl = `${env.WEB_URL}${localePrefix}/stores/create/success`;
  const cancelUrl = `${env.WEB_URL}${localePrefix}/stores/create/cancel`;

  const chargeAmount = getPlanChargeAmount(input.finalPrice);

  const { sessionId, paymentUrl } = await createThawaniCheckoutSession({
    clientReferenceId: input.subscriptionId,
    products: [
      {
        name: input.storeName.slice(0, 80),
        unit_amount: omrToBaisa(chargeAmount),
        quantity: 1
      }
    ],
    successUrl,
    cancelUrl,
    metadata: {
      subscriptionId: input.subscriptionId,
      userId: input.userId
    }
  });

  const payment = await storesRepository.createPaymentForSubscription({
    userId: input.userId,
    subscriptionId: input.subscriptionId,
    amount: chargeAmount,
    provider: PaymentProvider.THAWANI,
    sessionId,
    paymentUrl
  });

  return {
    activated: false,
    paymentId: payment.id,
    sessionId,
    paymentUrl
  };
}

export async function confirmThawaniStorePayment(userId: string, sessionId: string) {
  const payment = await storesRepository.findPaymentBySessionId(sessionId);
  if (!payment || !payment.storeSubscriptionId) {
    throw new ApiError(404, 'Payment not found');
  }
  if (payment.userId !== userId) {
    throw new ApiError(403, 'Forbidden');
  }
  if (payment.status === PaymentStatus.PAID) {
    const subscription = await activateStoreSubscription(payment.storeSubscriptionId);
    return { payment, subscription, alreadyPaid: true };
  }

  if (shouldSkipThawaniCheckout()) {
    await storesRepository.markPaymentPaid(payment.id, sessionId);
    const subscription = await activateStoreSubscription(payment.storeSubscriptionId);
    return { payment: { ...payment, status: PaymentStatus.PAID }, subscription, alreadyPaid: false };
  }

  const { retrieveThawaniCheckoutSession, isThawaniSessionPaid } = await import('../../shared/payments/thawani.client');
  const session = await retrieveThawaniCheckoutSession(sessionId);

  if (!isThawaniSessionPaid(session)) {
    throw new ApiError(400, 'Payment is not completed yet');
  }

  await storesRepository.markPaymentPaid(payment.id, sessionId);
  const subscription = await activateStoreSubscription(payment.storeSubscriptionId);
  return { payment: { ...payment, status: PaymentStatus.PAID }, subscription, alreadyPaid: false };
}
