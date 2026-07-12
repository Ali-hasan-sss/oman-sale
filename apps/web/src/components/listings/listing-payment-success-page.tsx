'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { getUserAccessToken } from '@/lib/user-auth';

const labels = {
  ar: {
    title: 'تم الدفع بنجاح',
    subtitle: 'تم تفعيل تمييز إعلانك. يمكنك متابعة إعلاناتك الآن.',
    confirming: 'جاري تأكيد الدفع...',
    confirmError: 'تعذر تأكيد الدفع. إذا تم خصم المبلغ تواصل مع الدعم.',
    home: 'العودة للرئيسية',
    myListings: 'إعلاناتي'
  },
  en: {
    title: 'Payment successful',
    subtitle: 'Your listing promotion is active. You can view your listings now.',
    confirming: 'Confirming payment...',
    confirmError: 'Could not confirm payment. Contact support if you were charged.',
    home: 'Back to home',
    myListings: 'My listings'
  }
} as const;

export function ListingPaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale, localizedPath } = useI18n();
  const text = labels[locale];
  const [message, setMessage] = useState<string>(text.confirming);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const token = getUserAccessToken();
    if (!token) {
      router.replace(localizedPath('/login'));
      return;
    }

    const sessionId = searchParams.get('session_id');
    const goToListings = () => router.replace(localizedPath('/my-listings'));

    if (!sessionId) {
      goToListings();
      return;
    }

    api
      .post('/promotions/payments/thawani/confirm', { sessionId })
      .then(goToListings)
      .catch(() => {
        setFailed(true);
        setMessage(text.confirmError);
      });
  }, [localizedPath, router, searchParams, text.confirmError]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="max-w-lg rounded-3xl bg-white p-8 text-center shadow-sm">
        <h1 className="mb-3 text-3xl font-black text-green-700">
          {failed ? '!' : '✓'} {text.title}
        </h1>
        <p className="mb-6 text-gray-600">{failed ? message : text.subtitle}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href={localizedPath('/')} className="rounded-lg border border-gray-300 px-5 py-3 font-bold">
            {text.home}
          </Link>
          <Link href={localizedPath('/my-listings')} className="rounded-lg bg-green-600 px-5 py-3 font-bold text-white">
            {text.myListings}
          </Link>
        </div>
      </div>
    </div>
  );
}
