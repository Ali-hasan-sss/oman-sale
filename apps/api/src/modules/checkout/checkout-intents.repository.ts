import { CheckoutIntentKind, CheckoutIntentStatus, PaymentProvider, Prisma } from '@prisma/client';

import { prisma } from '../../shared/prisma/client';

export class CheckoutIntentsRepository {
  create(input: {
    userId: string;
    kind: CheckoutIntentKind;
    payload: Prisma.InputJsonValue;
    amount: number;
  }) {
    return prisma.checkoutIntent.create({
      data: {
        userId: input.userId,
        kind: input.kind,
        payload: input.payload,
        amount: input.amount
      }
    });
  }

  findById(id: string) {
    return prisma.checkoutIntent.findUnique({ where: { id } });
  }

  findPendingById(id: string) {
    return prisma.checkoutIntent.findFirst({
      where: { id, status: CheckoutIntentStatus.PENDING }
    });
  }

  markCompleted(id: string, result: Prisma.InputJsonValue) {
    return prisma.checkoutIntent.update({
      where: { id },
      data: { status: CheckoutIntentStatus.COMPLETED, result }
    });
  }

  markCancelled(id: string) {
    return prisma.checkoutIntent.update({
      where: { id },
      data: { status: CheckoutIntentStatus.CANCELLED }
    });
  }

  createPaymentForIntent(input: {
    userId: string;
    intentId: string;
    amount: number;
    provider: PaymentProvider;
    sessionId: string;
    paymentUrl: string;
  }) {
    return prisma.payment.create({
      data: {
        userId: input.userId,
        amount: input.amount,
        provider: input.provider,
        status: 'PENDING',
        transactionId: input.sessionId,
        paymentUrl: input.paymentUrl,
        checkoutIntentId: input.intentId
      }
    });
  }

  linkPaymentToStoreSubscription(paymentId: string, subscriptionId: string) {
    return prisma.payment.update({
      where: { id: paymentId },
      data: { storeSubscriptionId: subscriptionId }
    });
  }

  linkPaymentToPromotion(paymentId: string, promotionId: string) {
    return prisma.payment.update({
      where: { id: paymentId },
      data: { promotionId }
    });
  }

  linkPaymentToBannerRequest(paymentId: string, bannerRequestId: string) {
    return prisma.payment.update({
      where: { id: paymentId },
      data: { bannerRequestId }
    });
  }
}

export const checkoutIntentsRepository = new CheckoutIntentsRepository();
