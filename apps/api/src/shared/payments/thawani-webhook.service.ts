import { BannerRequestStatus, CheckoutIntentKind, CheckoutIntentStatus, PaymentStatus, StoreSubscriptionStatus } from '@prisma/client';

import { AppEvents } from '../../shared/constants/events';
import { notifyAdminBannerRequestPending } from '../../modules/banner-requests/banner-admin-notifications';
import { bannerRequestsRepository } from '../../modules/banner-requests/banner-requests.repository';
import { loadCheckoutIntentResult } from '../../modules/checkout/checkout.service';
import { materializeCheckoutIntent } from '../../modules/checkout/checkout-intent-materialization.service';
import { checkoutIntentsRepository } from '../../modules/checkout/checkout-intents.repository';
import { promotionsRepository } from '../../modules/promotions/promotions.repository';
import { activateStoreSubscription, extendStoreSubscription } from '../../modules/stores/store-subscription.utils';
import { storesRepository } from '../../modules/stores/stores.repository';
import { eventBus } from '../../shared/utils/event-bus';
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

async function activatePaidStoreSubscription(
  subscriptionId: string,
  metadata?: Record<string, string | number>
) {
  const action = resolveStorePaymentAction(metadata);

  if (action === 'renew') {
    return extendStoreSubscription(subscriptionId);
  }

  return activateStoreSubscription(subscriptionId);
}

async function finalizeStoreSubscriptionPayment(
  paymentId: string,
  sessionId: string,
  subscriptionId: string,
  metadata?: Record<string, string | number>
) {
  await storesRepository.markPaymentPaid(paymentId, sessionId);
  return activatePaidStoreSubscription(subscriptionId, metadata);
}

async function finalizeBannerPayment(paymentId: string, requestId: string, sessionId: string) {
  await bannerRequestsRepository.markPaymentPaid(paymentId, sessionId);
  await bannerRequestsRepository.updateStatus(requestId, { status: BannerRequestStatus.PENDING_APPROVAL });
  await notifyAdminBannerRequestPending(requestId).catch(() => undefined);
  return bannerRequestsRepository.findById(requestId);
}

async function finalizePromotionPayment(paymentId: string, sessionId: string, promotionId: string) {
  await promotionsRepository.markPaymentPaid(paymentId, sessionId);
  const promotion = await promotionsRepository.activatePromotion(promotionId);
  eventBus.emit(AppEvents.PROMOTION_ACTIVATED, promotion);
  return promotion;
}

async function finalizeCheckoutIntentPayment(paymentId: string, sessionId: string, intentId: string) {
  const intent = await checkoutIntentsRepository.findById(intentId);
  if (!intent) {
    throw new Error(`Checkout intent not found: ${intentId}`);
  }

  if (intent.status === CheckoutIntentStatus.COMPLETED && intent.result) {
    await storesRepository.markPaymentPaid(paymentId, sessionId);
    return { intent, result: intent.result, alreadyMaterialized: true };
  }

  const result = await materializeCheckoutIntent({
    userId: intent.userId,
    kind: intent.kind,
    payload: intent.payload
  });

  await checkoutIntentsRepository.markCompleted(intentId, result);
  await storesRepository.markPaymentPaid(paymentId, sessionId);

  if ('subscriptionId' in result && typeof result.subscriptionId === 'string') {
    await checkoutIntentsRepository.linkPaymentToStoreSubscription(paymentId, result.subscriptionId);
  }

  if ('promotionId' in result && typeof result.promotionId === 'string') {
    await checkoutIntentsRepository.linkPaymentToPromotion(paymentId, result.promotionId);
  }

  if ('bannerRequestId' in result && typeof result.bannerRequestId === 'string') {
    await checkoutIntentsRepository.linkPaymentToBannerRequest(paymentId, result.bannerRequestId);
  }

  return { intent, result, alreadyMaterialized: false };
}

function mapCheckoutIntentCompletion(intent: Awaited<ReturnType<typeof checkoutIntentsRepository.findById>>, result: unknown) {
  if (!intent) return null;

  if (intent.kind === CheckoutIntentKind.STORE_CREATE) {
    return { handled: true as const, kind: 'store' as const, checkoutIntent: intent, result };
  }

  if (intent.kind === CheckoutIntentKind.LISTING_PROMOTION) {
    return { handled: true as const, kind: 'promotion' as const, checkoutIntent: intent, result };
  }

  if (intent.kind === CheckoutIntentKind.BANNER_REQUEST) {
    return { handled: true as const, kind: 'banner' as const, checkoutIntent: intent, result };
  }

  return null;
}

export async function completeThawaniPaymentBySession(sessionId: string, options?: { userId?: string }) {
  const payment = await storesRepository.findPaymentBySessionId(sessionId);
  if (!payment) {
    return { handled: false as const, reason: 'payment_not_found' as const };
  }

  if (options?.userId && payment.userId !== options.userId) {
    return { handled: false as const, reason: 'forbidden' as const };
  }

  if (payment.checkoutIntentId) {
    const intent = await checkoutIntentsRepository.findById(payment.checkoutIntentId);

    if (!intent) {
      return { handled: false as const, reason: 'payment_not_found' as const };
    }

    if (payment.status === PaymentStatus.PAID || intent.status === CheckoutIntentStatus.COMPLETED) {
      const loaded = await loadCheckoutIntentResult(intent.kind, intent.result ?? {});
      return {
        ...mapCheckoutIntentCompletion(intent, intent.result)!,
        payment,
        alreadyPaid: true,
        ...loaded
      };
    }

    if (!shouldSkipThawaniCheckout()) {
      const session = await retrieveThawaniCheckoutSession(sessionId);
      if (!isThawaniSessionPaid(session)) {
        return { handled: false as const, reason: 'not_paid' as const };
      }
    }

    const finalized = await finalizeCheckoutIntentPayment(payment.id, sessionId, payment.checkoutIntentId);
    const loaded = await loadCheckoutIntentResult(finalized.intent.kind, finalized.result);
    return {
      ...mapCheckoutIntentCompletion(finalized.intent, finalized.result)!,
      payment: { ...payment, status: PaymentStatus.PAID },
      alreadyPaid: false,
      ...loaded
    };
  }

  if (payment.status === PaymentStatus.PAID) {
    if (payment.storeSubscriptionId) {
      let paidMetadata: Record<string, string | number> | undefined;
      if (!shouldSkipThawaniCheckout()) {
        try {
          const session = await retrieveThawaniCheckoutSession(sessionId);
          paidMetadata = session.data?.metadata;
        } catch (error) {
          console.warn('[thawani-payment] could not load session metadata for paid payment', {
            sessionId,
            error
          });
        }
      }

      const subscription = await activatePaidStoreSubscription(payment.storeSubscriptionId, paidMetadata);
      return { handled: true as const, kind: 'store' as const, payment, subscription, alreadyPaid: true };
    }

    if (payment.promotionId) {
      const promotion = await promotionsRepository.activatePromotion(payment.promotionId);
      eventBus.emit(AppEvents.PROMOTION_ACTIVATED, promotion);
      return { handled: true as const, kind: 'promotion' as const, payment, promotion, alreadyPaid: true };
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
    const subscription = await finalizeStoreSubscriptionPayment(
      payment.id,
      sessionId,
      payment.storeSubscriptionId,
      sessionMetadata
    );
    return {
      handled: true as const,
      kind: 'store' as const,
      payment: { ...payment, status: PaymentStatus.PAID },
      subscription,
      alreadyPaid: false
    };
  }

  if (payment.promotionId) {
    const promotion = await finalizePromotionPayment(payment.id, sessionId, payment.promotionId);
    return {
      handled: true as const,
      kind: 'promotion' as const,
      payment: { ...payment, status: PaymentStatus.PAID },
      promotion,
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

function shouldRollbackAdOnCancel(metadata?: Record<string, string | number>) {
  return metadata?.['rollback ad on cancel'] === 'yes';
}

export async function cancelThawaniPaymentBySession(sessionId: string, options?: { userId?: string }) {
  const payment = await storesRepository.findPaymentBySessionId(sessionId);
  if (!payment) {
    return { handled: false as const, reason: 'payment_not_found' as const };
  }

  if (options?.userId && payment.userId !== options.userId) {
    return { handled: false as const, reason: 'forbidden' as const };
  }

  if (payment.status === PaymentStatus.PAID) {
    return { handled: false as const, reason: 'already_paid' as const };
  }

  if (payment.status === PaymentStatus.FAILED) {
    return { handled: true as const, kind: 'already_cancelled' as const };
  }

  let sessionMetadata: Record<string, string | number> | undefined;
  if (!shouldSkipThawaniCheckout()) {
    try {
      const session = await retrieveThawaniCheckoutSession(sessionId);
      if (isThawaniSessionPaid(session)) {
        return { handled: false as const, reason: 'already_paid' as const };
      }
      sessionMetadata = session.data?.metadata;
    } catch (error) {
      console.warn('[thawani-payment] could not verify session before cancel', { sessionId, error });
    }
  }

  await storesRepository.markPaymentFailed(payment.id);

  if (payment.checkoutIntentId) {
    await checkoutIntentsRepository.markCancelled(payment.checkoutIntentId);
    return { handled: true as const, kind: 'checkout_intent' as const, rolledBack: true };
  }

  if (payment.storeSubscriptionId) {
    const subscription = await storesRepository.findSubscriptionForPaymentCancel(payment.storeSubscriptionId);
    const paymentAction = resolveStorePaymentAction(sessionMetadata);

    if (
      subscription &&
      paymentAction === 'create' &&
      subscription.status === StoreSubscriptionStatus.PENDING &&
      !subscription.store.isActive &&
      !subscription.store.deletedAt
    ) {
      await storesRepository.rollbackPendingStoreCreation(subscription.storeId);
      return { handled: true as const, kind: 'store' as const, rolledBack: true };
    }

    return { handled: true as const, kind: 'store' as const, rolledBack: false };
  }

  if (payment.promotionId) {
    const promotion = await promotionsRepository.findPromotionForPaymentCancel(payment.promotionId);
    if (promotion && !promotion.isActive) {
      await promotionsRepository.rollbackPendingPromotion(payment.promotionId, {
        deleteAd: shouldRollbackAdOnCancel(sessionMetadata)
      });
    }

    return { handled: true as const, kind: 'promotion' as const, rolledBack: true };
  }

  if (payment.bannerRequestId) {
    await bannerRequestsRepository.updateStatus(payment.bannerRequestId, {
      status: BannerRequestStatus.CANCELLED
    });
    return { handled: true as const, kind: 'banner' as const, rolledBack: true };
  }

  return { handled: false as const, reason: 'unsupported_payment' as const };
}

export async function handleThawaniWebhookEvent(event: ThawaniWebhookEvent) {
  try {
    if (event.event_type !== 'checkout.completed') {
      return { handled: false as const, reason: 'ignored_event' as const };
    }

    const sessionId = event.data?.session_id;
    if (!sessionId || event.data?.payment_status !== 'paid') {
      return { handled: false as const, reason: 'ignored_payload' as const };
    }

    return await completeThawaniPaymentBySession(sessionId);
  } catch (error) {
    console.error('[thawani-webhook] failed to process event', {
      eventType: event.event_type,
      sessionId: event.data?.session_id,
      error
    });
    return { handled: false as const, reason: 'processing_failed' as const };
  }
}
