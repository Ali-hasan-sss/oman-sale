'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { getUserAccessToken } from '@/lib/user-auth';

const labels = {
  ar: {
    title: 'تم إرسال طلب الإعلان',
    subtitle: 'تم استلام طلبك بنجاح. سيظهر إعلانك في البنر بعد موافقة الإدارة.',
    confirming: 'جاري تأكيد الدفع...',
    confirmError: 'تعذر تأكيد الدفع. تواصل مع الدعم إذا تم خصم المبلغ.',
    home: 'العودة للرئيسية'
  },
  en: {
    title: 'Banner ad request submitted',
    subtitle: 'Your request was received. Your ad will appear in the banner after admin approval.',
    confirming: 'Confirming payment...',
    confirmError: 'Could not confirm payment. Contact support if you were charged.',
    home: 'Back to home'
  }
} as const;

export function BannerAdSuccessPage() {
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
    if (!sessionId) {
      setMessage(text.subtitle);
      return;
    }

    api
      .post('/banner-requests/payments/thawani/confirm', { sessionId })
      .then(() => setMessage(text.subtitle))
      .catch(() => {
        setFailed(true);
        setMessage(text.confirmError);
      });
  }, [localizedPath, router, searchParams, text.confirmError, text.subtitle]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="max-w-lg rounded-3xl bg-white p-8 text-center shadow-sm">
        <h1 className="mb-3 text-3xl font-black text-green-700">
          {failed ? '!' : '✓'} {text.title}
        </h1>
        <p className="mb-6 text-gray-600">{message}</p>
        <Link href={localizedPath('/')} className="rounded-lg bg-brand-600 px-5 py-3 font-bold text-white">
          {text.home}
        </Link>
      </div>
    </div>
  );
}
