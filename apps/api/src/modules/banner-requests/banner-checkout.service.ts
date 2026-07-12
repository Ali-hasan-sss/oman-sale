import { BannerRequestStatus, PaymentProvider, PaymentStatus } from '@prisma/client';

import { env } from '../../config/env';
import {
  buildThawaniPaymentMetadata,
  createThawaniCheckoutSession,
  isThawaniConfigured,
  omrToBaisa,
  shouldSkipThawaniCheckout
} from '../../shared/payments/thawani.client';
import { ApiError } from '../../shared/utils/api-error';
import { usersRepository } from '../users/users.repository';
import { bannerRequestsRepository } from './banner-requests.repository';
import { notifyAdminBannerRequestPending } from './banner-admin-notifications';

type CheckoutInput = {
  userId: string;
  requestId: string;
  totalPrice: number;
  locale?: 'ar' | 'en';
};

export type BannerCheckoutResult = {
  paid: boolean;
  paymentId?: string;
  sessionId?: string;
  paymentUrl?: string;
};

async function moveToPendingApproval(requestId: string) {
  await bannerRequestsRepository.updateStatus(requestId, { status: BannerRequestStatus.PENDING_APPROVAL });
  await notifyAdminBannerRequestPending(requestId).catch(() => undefined);
}

export async function checkoutBannerRequest(input: CheckoutInput): Promise<BannerCheckoutResult> {
  if (input.totalPrice <= 0) {
    await moveToPendingApproval(input.requestId);
    return { paid: true };
  }

  if (shouldSkipThawaniCheckout()) {
    await moveToPendingApproval(input.requestId);
    return { paid: true };
  }

  if (!isThawaniConfigured()) {
    throw new ApiError(503, 'Payment gateway is not configured');
  }

  const localePrefix = input.locale === 'en' ? '/en' : '/ar';
  const successUrl = `${env.WEB_URL}${localePrefix}/banner-ad/success`;
  const cancelUrl = `${env.WEB_URL}${localePrefix}/banner-ad/cancel`;

  const user = await usersRepository.findById(input.userId);
  const customerName = user?.fullName ?? 'Customer';

  const { sessionId, paymentUrl } = await createThawaniCheckoutSession({
    clientReferenceId: input.requestId,
    products: [
      {
        name: 'Homepage banner ad',
        unit_amount: omrToBaisa(input.totalPrice),
        quantity: 1
      }
    ],
    successUrl,
    cancelUrl,
    metadata: buildThawaniPaymentMetadata({
      customerName,
      orderId: input.requestId,
      extra: {
        'service type': 'banner ad'
      }
    })
  });

  const payment = await bannerRequestsRepository.createPaymentForRequest({
    userId: input.userId,
    requestId: input.requestId,
    amount: input.totalPrice,
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

export async function confirmThawaniBannerPayment(userId: string, sessionId: string) {
  const payment = await bannerRequestsRepository.findPaymentBySessionId(sessionId);
  if (!payment || !payment.bannerRequestId || !payment.bannerRequest) {
    throw new ApiError(404, 'Payment not found');
  }
  if (payment.userId !== userId) {
    throw new ApiError(403, 'Forbidden');
  }

  const requestId = payment.bannerRequestId;

  if (payment.status === PaymentStatus.PAID) {
    const request = await bannerRequestsRepository.findById(requestId);
    return { payment, request, alreadyPaid: true };
  }

  if (shouldSkipThawaniCheckout()) {
    await bannerRequestsRepository.markPaymentPaid(payment.id, sessionId);
    await moveToPendingApproval(requestId);
    const request = await bannerRequestsRepository.findById(requestId);
    return { payment: { ...payment, status: PaymentStatus.PAID }, request, alreadyPaid: false };
  }

  const { retrieveThawaniCheckoutSession, isThawaniSessionPaid } = await import('../../shared/payments/thawani.client');
  const session = await retrieveThawaniCheckoutSession(sessionId);

  if (!isThawaniSessionPaid(session)) {
    throw new ApiError(400, 'Payment is not completed yet');
  }

  await bannerRequestsRepository.markPaymentPaid(payment.id, sessionId);
  await moveToPendingApproval(requestId);
  const request = await bannerRequestsRepository.findById(requestId);
  return { payment: { ...payment, status: PaymentStatus.PAID }, request, alreadyPaid: false };
}
