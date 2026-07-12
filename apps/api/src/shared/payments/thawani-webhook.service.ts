import { BannerRequestStatus, PaymentStatus } from '@prisma/client';

import { notifyAdminBannerRequestPending } from '../../modules/banner-requests/banner-admin-notifications';
import { bannerRequestsRepository } from '../../modules/banner-requests/banner-requests.repository';
import { activateStoreSubscription, extendStoreSubscription } from '../../modules/stores/store-subscription.utils';
import { storesRepository } from '../../modules/stores/stores.repository';
import type { ThawaniWebhookEvent } from './thawani.client';
import { isThawaniSessionPaid, retrieveThawaniCheckoutSession, shouldSkipThawaniCheckout } from './thawani.client';

type StorePaymentAction = 'create' | 'activate' | 'upgrade' | 'renew';

function resolveStorePaymentAction(metadata?: Record<string, string | number>): StorePaymentAction {
  const raw = metadata?.['payment action'];
  if (raw === 'renew' || raw === 'activate' || raw === 'upgrade' || raw === 'create') {
    return raw;
  }
  return 'create';
}

async function finalizeStoreSubscriptionPayment(
  paymentId: string,
  sessionId: string,
  subscriptionId: string,
  action: StorePaymentAction
) {
  await storesRepository.markPaymentPaid(paymentId, sessionId);

  if (action === 'renew') {
    return extendStoreSubscription(subscriptionId);
  }

  return activateStoreSubscription(subscriptionId);
}

async function finalizeBannerPayment(paymentId: string, requestId: string, sessionId: string) {
  await bannerRequestsRepository.markPaymentPaid(paymentId, sessionId);
  await bannerRequestsRepository.updateStatus(requestId, { status: BannerRequestStatus.PENDING_APPROVAL });
  await notifyAdminBannerRequestPending(requestId).catch(() => undefined);
  return bannerRequestsRepository.findById(requestId);
}

export async function completeThawaniPaymentBySession(sessionId: string, options?: { userId?: string }) {
  const payment = await storesRepository.findPaymentBySessionId(sessionId);
  if (!payment) {
    return { handled: false as const, reason: 'payment_not_found' as const };
  }

  if (options?.userId && payment.userId !== options.userId) {
    return { handled: false as const, reason: 'forbidden' as const };
  }

  if (payment.status === PaymentStatus.PAID) {
    if (payment.storeSubscriptionId) {
      const subscription = await activateStoreSubscription(payment.storeSubscriptionId);
      return { handled: true as const, kind: 'store' as const, payment, subscription, alreadyPaid: true };
    }

    if (payment.bannerRequestId) {
      const request = await bannerRequestsRepository.findById(payment.bannerRequestId);
      return { handled: true as const, kind: 'banner' as const, payment, request, alreadyPaid: true };
    }
  }

  let sessionMetadata: Record<string, string | number> | undefined;
  if (!shouldSkipThawaniCheckout()) {
    const session = await retrieveThawaniCheckoutSession(sessionId);
    if (!isThawaniSessionPaid(session)) {
      return { handled: false as const, reason: 'not_paid' as const };
    }
    sessionMetadata = session.data?.metadata;
  }

  if (payment.storeSubscriptionId) {
    const action = resolveStorePaymentAction(sessionMetadata);
    const subscription = await finalizeStoreSubscriptionPayment(
      payment.id,
      sessionId,
      payment.storeSubscriptionId,
      action
    );
    return {
      handled: true as const,
      kind: 'store' as const,
      payment: { ...payment, status: PaymentStatus.PAID },
      subscription,
      alreadyPaid: false
    };
  }

  if (payment.bannerRequestId) {
    const request = await finalizeBannerPayment(payment.id, payment.bannerRequestId, sessionId);
    return {
      handled: true as const,
      kind: 'banner' as const,
      payment: { ...payment, status: PaymentStatus.PAID },
      request,
      alreadyPaid: false
    };
  }

  return { handled: false as const, reason: 'unsupported_payment' as const };
}

export async function handleThawaniWebhookEvent(event: ThawaniWebhookEvent) {
  if (event.event_type !== 'checkout.completed') {
    return { handled: false as const, reason: 'ignored_event' as const };
  }

  const sessionId = event.data?.session_id;
  if (!sessionId || event.data?.payment_status !== 'paid') {
    return { handled: false as const, reason: 'ignored_payload' as const };
  }

  return completeThawaniPaymentBySession(sessionId);
}
