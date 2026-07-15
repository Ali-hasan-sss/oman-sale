'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

import { useI18n } from '@/lib/i18n';
import { storeListingPaymentReturn } from '@/lib/payment-return';
import { useThawaniPaymentConfirm, type ThawaniPaymentConfirmResult } from '@/lib/use-thawani-payment-confirm';

const labels = {
  ar: {
    title: 'تم الدفع بنجاح',
    subtitle: 'تم تفعيل تمييز إعلانك. جاري فتح إعلاناتك...',
    confirming: 'جاري تأكيد الدفع وإنشاء الإعلان...',
    confirmError: 'تعذر تأكيد الدفع. إذا تم خصم المبلغ تواصل مع الدعم.',
    missingSession: 'تعذر العثور على جلسة الدفع. لم يتم إنشاء الإعلان.',
    home: 'العودة للرئيسية',
    myListings: 'إعلاناتي'
  },
  en: {
    title: 'Payment successful',
    subtitle: 'Your listing promotion is active. Opening your listings...',
    confirming: 'Confirming payment and creating your listing...',
    confirmError: 'Could not confirm payment. Contact support if you were charged.',
    missingSession: 'Payment session was not found. The listing was not created.',
    home: 'Back to home',
    myListings: 'My listings'
  }
} as const;

export function ListingPaymentSuccessPage() {
  const router = useRouter();
  const { locale, localizedPath } = useI18n();
  const text = labels[locale];

  const handleSuccess = useCallback(
    (result: ThawaniPaymentConfirmResult) => {
      if (!result.adId) return;

      storeListingPaymentReturn({
        adId: result.adId,
        promotionId: result.promotionId,
        action: result.action === 'promote' ? 'promote' : 'create'
      });

      router.replace(localizedPath('/my-listings'));
    },
    [localizedPath, router]
  );

  const { isConfirming, failed, missingSession } = useThawaniPaymentConfirm({
    confirmEndpoint: '/promotions/payments/thawani/confirm',
    loginPath: localizedPath('/login'),
    onSuccess: handleSuccess
  });

  const statusMessage = failed
    ? text.confirmError
    : missingSession
      ? text.missingSession
      : isConfirming
        ? text.confirming
        : text.subtitle;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="max-w-lg rounded-3xl bg-white p-8 text-center shadow-sm">
        <h1 className="mb-3 text-3xl font-black text-green-700">
          {failed || missingSession ? '!' : isConfirming ? '…' : '✓'} {text.title}
        </h1>
        <p className="mb-6 text-gray-600">{statusMessage}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href={localizedPath('/')} className="rounded-lg border border-gray-300 px-5 py-3 font-bold">
            {text.home}
          </Link>
          {!isConfirming ? (
            <Link href={localizedPath('/my-listings')} className="rounded-lg bg-green-600 px-5 py-3 font-bold text-white">
              {text.myListings}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
