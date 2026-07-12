import { PaymentProvider } from '@prisma/client';

import { env } from '../../config/env';
import {
  buildThawaniPaymentMetadata,
  createThawaniCheckoutSession,
  isThawaniConfigured,
  omrToBaisa,
  shouldSkipThawaniCheckout
} from '../../shared/payments/thawani.client';
import { completeThawaniPaymentBySession } from '../../shared/payments/thawani-webhook.service';
import { ApiError } from '../../shared/utils/api-error';
import { getPlanChargeAmount } from '../../shared/utils/plan-pricing.utils';
import { usersRepository } from '../users/users.repository';
import { promotionsRepository } from './promotions.repository';

type CheckoutInput = {
  userId: string;
  promotionId: string;
  adTitle: string;
  planName: string;
  totalPrice: number;
  locale?: 'ar' | 'en';
};

export type PromotionCheckoutResult = {
  paid: boolean;
  paymentId?: string;
  sessionId?: string;
  paymentUrl?: string;
};

function getCheckoutUrls(locale: 'ar' | 'en') {
  const localePrefix = locale === 'en' ? '/en' : '/ar';
  return {
    successUrl: `${env.WEB_URL}${localePrefix}/listings/payment/success`,
    cancelUrl: `${env.WEB_URL}${localePrefix}/listings/payment/cancel`
  };
}

export async function checkoutAdPromotion(input: CheckoutInput): Promise<PromotionCheckoutResult> {
  if (input.totalPrice <= 0) {
    await promotionsRepository.activatePromotion(input.promotionId);
    return { paid: true };
  }

  if (shouldSkipThawaniCheckout()) {
    await promotionsRepository.activatePromotion(input.promotionId);
    return { paid: true };
  }

  if (!isThawaniConfigured()) {
    throw new ApiError(503, 'Payment gateway is not configured');
  }

  const locale = input.locale ?? 'ar';
  const { successUrl, cancelUrl } = getCheckoutUrls(locale);
  const chargeAmount = getPlanChargeAmount(input.totalPrice);

  const user = await usersRepository.findById(input.userId);
  const customerName = user?.fullName ?? 'Customer';

  const { sessionId, paymentUrl } = await createThawaniCheckoutSession({
    clientReferenceId: input.promotionId,
    products: [
      {
        name: input.planName.slice(0, 80),
        unit_amount: omrToBaisa(chargeAmount),
        quantity: 1
      }
    ],
    successUrl,
    cancelUrl,
    metadata: buildThawaniPaymentMetadata({
      customerName,
      orderId: input.promotionId,
      extra: {
        'service type': 'listing promotion',
        'listing title': input.adTitle.slice(0, 80)
      }
    })
  });

  const payment = await promotionsRepository.createPaymentForPromotion({
    userId: input.userId,
    promotionId: input.promotionId,
    amount: chargeAmount,
    provider: PaymentProvider.THAWANI,
    sessionId,
    paymentUrl
  });

  return {
    paid: false,
    paymentId: payment.id,
    sessionId,
    paymentUrl
  };
}

export async function confirmThawaniPromotionPayment(userId: string, sessionId: string) {
  const result = await completeThawaniPaymentBySession(sessionId, { userId });

  if (!result.handled) {
    if (result.reason === 'forbidden') throw new ApiError(403, 'Forbidden');
    if (result.reason === 'not_paid') throw new ApiError(400, 'Payment is not completed yet');
    throw new ApiError(404, 'Payment not found');
  }

  if (result.kind !== 'promotion' || !result.promotion) {
    throw new ApiError(404, 'Payment not found');
  }

  return {
    payment: result.payment,
    promotion: result.promotion,
    alreadyPaid: result.alreadyPaid
  };
}
