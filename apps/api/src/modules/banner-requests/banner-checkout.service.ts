import {
  cancelThawaniPaymentBySession,
  completeThawaniPaymentBySession
} from '../../shared/payments/thawani-webhook.service';
import { ApiError } from '../../shared/utils/api-error';

export async function confirmThawaniBannerPayment(userId: string, sessionId: string) {
  const result = await completeThawaniPaymentBySession(sessionId, { userId });

  if (!result.handled) {
    if (result.reason === 'forbidden') throw new ApiError(403, 'Forbidden');
    if (result.reason === 'not_paid') throw new ApiError(400, 'Payment is not completed yet');
    throw new ApiError(404, 'Payment not found');
  }

  if (result.kind !== 'banner') {
    throw new ApiError(404, 'Payment not found');
  }

  return {
    payment: result.payment,
    request: 'request' in result ? result.request : null,
    alreadyPaid: result.alreadyPaid
  };
}

export async function cancelThawaniBannerPayment(userId: string, sessionId: string) {
  const result = await cancelThawaniPaymentBySession(sessionId, { userId });

  if (!result.handled) {
    if (result.reason === 'forbidden') throw new ApiError(403, 'Forbidden');
    if (result.reason === 'already_paid') throw new ApiError(400, 'Payment is already completed');
    throw new ApiError(404, 'Payment not found');
  }

  return result;
}

export type BannerCheckoutResult = {
  paid: boolean;
  paymentId?: string;
  sessionId?: string;
  paymentUrl?: string;
};

export async function checkoutBannerRequest(_input: {
  userId: string;
  requestId: string;
  totalPrice: number;
  locale?: 'ar' | 'en';
}): Promise<BannerCheckoutResult> {
  throw new ApiError(410, 'Legacy banner checkout is no longer supported');
}
