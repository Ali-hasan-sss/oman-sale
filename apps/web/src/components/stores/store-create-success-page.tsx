'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

import { useI18n } from '@/lib/i18n';
import { storeStorePaymentReturn } from '@/lib/payment-return';
import { useThawaniPaymentConfirm, type ThawaniPaymentConfirmResult } from '@/lib/use-thawani-payment-confirm';

const labels = {
  ar: {
    title: 'تم إنشاء المتجر بنجاح',
    subtitle: 'متجرك جاهز الآن. جاري فتح صفحة المتجر...',
    confirming: 'جاري تأكيد الدفع...',
    confirmError: 'تعذر تأكيد الدفع. تواصل مع الدعم إذا تم خصم المبلغ.',
    missingSession: 'تعذر العثور على جلسة الدفع. لم يتم إنشاء المتجر.',
    home: 'العودة للرئيسية',
    myStore: 'إدارة المتجر'
  },
  en: {
    title: 'Store created successfully',
    subtitle: 'Your store is ready. Opening your store page...',
    confirming: 'Confirming payment...',
    confirmError: 'Could not confirm payment. Contact support if you were charged.',
    missingSession: 'Payment session was not found. The store was not created.',
    home: 'Back to home',
    myStore: 'Manage store'
  }
} as const;

export function StoreCreateSuccessPage() {
  const router = useRouter();
  const { locale, localizedPath } = useI18n();
  const text = labels[locale];

  const handleSuccess = useCallback(
    (result: ThawaniPaymentConfirmResult) => {
      if (!result.storeId) return;

      storeStorePaymentReturn({
        storeId: result.storeId,
        action: 'create'
      });
      router.replace(localizedPath('/my-store'));
    },
    [localizedPath, router]
  );

  const { isConfirming, failed, missingSession } = useThawaniPaymentConfirm({
    confirmEndpoint: '/stores/payments/thawani/confirm',
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
        <h1 className="mb-3 text-3xl font-black text-green-700">{failed || missingSession ? '!' : isConfirming ? '…' : '✓'} {text.title}</h1>
        <p className="mb-6 text-gray-600">{statusMessage}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href={localizedPath('/')} className="rounded-lg border border-gray-300 px-5 py-3 font-bold">
            {text.home}
          </Link>
          {!isConfirming ? (
            <Link href={localizedPath('/my-store')} className="rounded-lg bg-green-600 px-5 py-3 font-bold text-white">
              {text.myStore}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
