import { PaymentProvider } from '@prisma/client';

import { env } from '../../config/env';
import {
  buildThawaniPaymentMetadata,
  createThawaniCheckoutSession,
  isThawaniConfigured,
  omrToBaisa,
  shouldSkipThawaniCheckout
} from '../../shared/payments/thawani.client';
import { completeThawaniPaymentBySession, cancelThawaniPaymentBySession } from '../../shared/payments/thawani-webhook.service';
import { ApiError } from '../../shared/utils/api-error';
import { usersRepository } from '../users/users.repository';
import { activateStoreSubscription } from './store-subscription.utils';
import { getPlanChargeAmount } from '../../shared/utils/plan-pricing.utils';
import { storesRepository } from './stores.repository';

export type StorePaymentAction = 'create' | 'activate' | 'upgrade' | 'renew';
export type StoreCheckoutFlow = 'create' | 'manage';

type CheckoutInput = {
  userId: string;
  subscriptionId: string;
  storeName: string;
  finalPrice: number;
  locale?: 'ar' | 'en';
  paymentAction: StorePaymentAction;
  flow?: StoreCheckoutFlow;
};

export type StoreCheckoutResult = {
  activated: boolean;
  paymentId?: string;
  sessionId?: string;
  paymentUrl?: string;
};

function getCheckoutUrls(locale: 'ar' | 'en', flow: StoreCheckoutFlow) {
  const localePrefix = locale === 'en' ? '/en' : '/ar';

  if (flow === 'create') {
    return {
      successUrl: `${env.WEB_URL}${localePrefix}/stores/create/success`,
      cancelUrl: `${env.WEB_URL}${localePrefix}/stores/create/cancel`
    };
  }

  return {
    successUrl: `${env.WEB_URL}${localePrefix}/stores/payment/success`,
    cancelUrl: `${env.WEB_URL}${localePrefix}/stores/payment/cancel`
  };
}

export async function checkoutStoreSubscription(input: CheckoutInput): Promise<StoreCheckoutResult> {
  if (input.finalPrice <= 0) {
    await activateStoreSubscription(input.subscriptionId);
    return { activated: true };
  }

  if (shouldSkipThawaniCheckout()) {
    await activateStoreSubscription(input.subscriptionId);
    return { activated: true };
  }

  if (!isThawaniConfigured()) {
    throw new ApiError(503, 'Payment gateway is not configured');
  }

  const locale = input.locale ?? 'ar';
  const flow = input.flow ?? 'manage';
  const { successUrl, cancelUrl } = getCheckoutUrls(locale, flow);
  const chargeAmount = getPlanChargeAmount(input.finalPrice);

  const user = await usersRepository.findById(input.userId);
  const customerName = user?.fullName ?? 'Customer';

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
    metadata: buildThawaniPaymentMetadata({
      customerName,
      orderId: input.subscriptionId,
      extra: {
        'service type': 'store subscription',
        'store name': input.storeName.slice(0, 80),
        'payment action': input.paymentAction
      }
    })
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
  const result = await completeThawaniPaymentBySession(sessionId, { userId });

  if (!result.handled) {
    if (result.reason === 'forbidden') throw new ApiError(403, 'Forbidden');
    if (result.reason === 'not_paid') throw new ApiError(400, 'Payment is not completed yet');
    throw new ApiError(404, 'Payment not found');
  }

  if (result.kind !== 'store') {
    throw new ApiError(404, 'Payment not found');
  }

  return {
    payment: result.payment,
    subscription: 'subscription' in result ? result.subscription : undefined,
    store: 'store' in result ? result.store : undefined,
    alreadyPaid: result.alreadyPaid
  };
}

export async function cancelThawaniStorePayment(userId: string, sessionId: string) {
  const result = await cancelThawaniPaymentBySession(sessionId, { userId });

  if (!result.handled) {
    if (result.reason === 'forbidden') throw new ApiError(403, 'Forbidden');
    if (result.reason === 'already_paid') throw new ApiError(400, 'Payment is already completed');
    throw new ApiError(404, 'Payment not found');
  }

  return result;
}
