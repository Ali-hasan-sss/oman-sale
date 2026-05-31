'use client';

import { Globe, Search, Store } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useMemo, useState } from 'react';

import { HeaderAuthAction } from '@/components/auth/user-menu';
import { ChatNavLink } from '@/components/chat/chat-nav-link';
import { SiteFooter } from '@/components/home/site-footer';
import { MobileNavMenu } from '@/components/navigation/mobile-nav-menu';
import { StorePlanCard } from '@/components/stores/store-plan-card';
import { api } from '@/lib/api';
import { resolveApiErrorMessage } from '@/lib/api-errors';
import { buildCategoryTree } from '@/lib/category-tree';
import { useI18n } from '@/lib/i18n';
import { getUserAccessToken } from '@/lib/user-auth';

type RootCategory = {
  id: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  parentId?: string | null;
};

type StorePlanPricing = {
  id: string;
  billingPeriod: 'MONTHLY' | 'YEARLY';
  finalPrice?: number;
  price: string | number;
  maxListings: number;
};

type StorePlan = {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  trialDays?: number;
  trialAvailable?: boolean;
  pricing: StorePlanPricing[];
};

const labels = {
  ar: {
    title: 'إنشاء متجر',
    subtitle: 'اختر الفئة الرئيسية والخطة، ثم أكمل بيانات متجرك',
    nameAr: 'اسم المتجر بالعربية *',
    nameEn: 'اسم المتجر بالإنجليزية *',
    bioAr: 'نبذة عن المتجر (عربي)',
    bioEn: 'نبذة عن المتجر (إنجليزي)',
    category: 'الفئة الرئيسية *',
    selectCategory: 'اختر الفئة الرئيسية',
    phone: 'رقم التواصل *',
    nationalId: 'رقم الهوية / جواز السفر *',
    nationalIdHint: 'البطاقة الشخصية العمانية أو جواز السفر',
    crNumber: 'رقم السجل التجاري *',
    plan: 'خطة الاشتراك *',
    storeDetails: 'بيانات المتجر',
    billingMonthly: 'شهري',
    billingYearly: 'سنوي',
    freePlan: 'مجاني',
    maxListings: 'حد العروض',
    perMonth: 'شهرياً',
    perYear: 'سنوياً',
    submit: 'متابعة الدفع',
    submitFree: 'إنشاء المتجر',
    submitTrial: 'بدء الفترة التجريبية',
    submitting: 'جاري المعالجة...',
    loginRequired: 'يجب تسجيل الدخول أولاً',
    loadError: 'تعذر تحميل البيانات.',
    createError: 'تعذر إنشاء المتجر. تحقق من البيانات وحاول مرة أخرى.',
    noPlans: 'لا توجد خطط متاحة لهذه الفئة حالياً.',
    loadingPlans: 'جاري تحميل الخطط...',
    selectCategoryFirst: 'اختر الفئة الرئيسية لعرض خطط الاشتراك والأسعار.',
    trialBadge: 'تجربة مجانية',
    trialDays: 'يوم تجريبي',
    selectPlan: 'اختيار الخطة',
    alreadyHasStore: 'لديك متجر مرتبط بحسابك بالفعل.'
  },
  en: {
    title: 'Create a store',
    subtitle: 'Choose your main category and plan, then complete your store details',
    nameAr: 'Store name (Arabic) *',
    nameEn: 'Store name (English) *',
    bioAr: 'Store bio (Arabic)',
    bioEn: 'Store bio (English)',
    category: 'Main category *',
    selectCategory: 'Select main category',
    phone: 'Contact phone *',
    nationalId: 'National ID / Passport *',
    nationalIdHint: 'Omani civil ID or passport number',
    crNumber: 'Commercial registration number *',
    plan: 'Subscription plan *',
    storeDetails: 'Store details',
    billingMonthly: 'Monthly',
    billingYearly: 'Yearly',
    freePlan: 'Free',
    maxListings: 'Listing limit',
    perMonth: 'per month',
    perYear: 'per year',
    submit: 'Proceed to payment',
    submitFree: 'Create store',
    submitTrial: 'Start free trial',
    submitting: 'Processing...',
    loginRequired: 'Please log in first',
    loadError: 'Could not load page data.',
    createError: 'Could not create the store. Check your details and try again.',
    noPlans: 'No plans are available for this category yet.',
    loadingPlans: 'Loading plans...',
    selectCategoryFirst: 'Select a main category to view subscription plans and prices.',
    trialBadge: 'Free trial',
    trialDays: 'trial days',
    selectPlan: 'Select plan',
    alreadyHasStore: 'You already have a store linked to your account.'
  }
} as const;

export function CreateStorePage() {
  const router = useRouter();
  const { dir, locale, localizedPath, m, toggleLocale } = useI18n();
  const text = labels[locale];

  const [categories, setCategories] = useState<RootCategory[]>([]);
  const [plans, setPlans] = useState<StorePlan[]>([]);
  const [rootCategoryId, setRootCategoryId] = useState('');
  const [planId, setPlanId] = useState('');
  const [billingPeriod, setBillingPeriod] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [bioAr, setBioAr] = useState('');
  const [bioEn, setBioEn] = useState('');
  const [phone, setPhone] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [commercialRegistrationNumber, setCommercialRegistrationNumber] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasExistingStore, setHasExistingStore] = useState(false);

  const rootCategories = useMemo(() => buildCategoryTree(categories), [categories]);

  const selectedPlan = plans.find((plan) => plan.id === planId);
  const selectedPricing = selectedPlan?.pricing.find((row) => row.billingPeriod === billingPeriod);
  const finalPrice = Number(selectedPricing?.finalPrice ?? selectedPricing?.price ?? 0);
  const isFreePlan = finalPrice <= 0;
  const isTrialEligible = Boolean(selectedPlan?.trialAvailable && selectedPlan.trialDays && selectedPlan.trialDays > 0);

  useEffect(() => {
    const token = getUserAccessToken();
    if (!token) {
      router.replace(localizedPath('/login'));
      return;
    }

    api
      .get<{ data: RootCategory[] }>('/categories', { params: { locale, includeInactive: false } })
      .then((response) => setCategories(response.data.data))
      .catch(() => setError(text.loadError))
      .finally(() => setIsLoading(false));

    api
      .get<{ data: Array<{ id: string }> }>('/stores/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => {
        if (response.data.data.length >= 1) {
          setHasExistingStore(true);
          router.replace(localizedPath('/my-store'));
        }
      })
      .catch(() => undefined);
  }, [locale, localizedPath, router, text.loadError]);

  useEffect(() => {
    if (!rootCategoryId) {
      setPlans([]);
      setPlanId('');
      return;
    }

    setIsLoadingPlans(true);
    setError('');

    api
      .get<{ data: StorePlan[] }>('/stores/plans', { params: { rootCategoryId } })
      .then((response) => {
        setPlans(response.data.data);
        setPlanId(response.data.data[0]?.id ?? '');
        setBillingPeriod('MONTHLY');
      })
      .catch(() => setError(text.loadError))
      .finally(() => setIsLoadingPlans(false));
  }, [rootCategoryId, text.loadError]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!planId || !rootCategoryId) return;

    setError('');
    setIsSubmitting(true);

    try {
      const response = await api.post<{ data: { checkout?: { paymentUrl?: string }; requiresPayment: boolean; isTrial?: boolean } }>(
        '/stores',
        {
          nameAr: nameAr.trim(),
          nameEn: nameEn.trim(),
          bioAr: bioAr.trim(),
          bioEn: bioEn.trim(),
          phone: phone.trim(),
          nationalId: nationalId.trim(),
          commercialRegistrationNumber: commercialRegistrationNumber.trim(),
          rootCategoryId,
          planId,
          billingPeriod
        },
        { params: { locale } }
      );

      const paymentUrl = response.data.data.checkout?.paymentUrl;
      if (response.data.data.requiresPayment && paymentUrl) {
        window.location.href = paymentUrl;
        return;
      }

      router.push(localizedPath('/stores/create/success'));
    } catch (submitError) {
      setError(
        resolveApiErrorMessage(
          submitError,
          {
            ACCOUNT_BLOCKED: m.errors.ACCOUNT_BLOCKED,
            ACCOUNT_INACTIVE: m.errors.ACCOUNT_INACTIVE,
            STORE_LIMIT_REACHED: m.errors.STORE_LIMIT_REACHED
          },
          text.createError
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = 'w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-green-500';

  return (
    <div className="min-h-screen bg-gray-50" dir={dir}>
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="mb-4 flex items-center justify-between gap-4">
            <Link className="flex items-center gap-3" href={localizedPath('/')}>
              <img src="/logo.png" alt="Oman Sale" className="h-14 w-auto" />
            </Link>
            <MobileNavMenu />
            <div className="hidden items-center gap-4 lg:flex">
              <button className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2" onClick={toggleLocale} type="button">
                <Globe size={18} />
                <span className="text-sm">{m.common.languageSwitch}</span>
              </button>
              <ChatNavLink className="rounded-lg border border-gray-300 px-4 py-2" />
              <HeaderAuthAction loginClassName="rounded-lg bg-green-600 px-4 py-2 text-white" />
            </div>
          </div>
          <div className="relative hidden max-w-xl lg:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4" placeholder={m.home.searchPlaceholder} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        {hasExistingStore ? (
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
            <p className="text-gray-600">{text.alreadyHasStore}</p>
          </div>
        ) : (
        <>
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-green-700">
            <Store size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black">{text.title}</h1>
            <p className="text-gray-600">{text.subtitle}</p>
          </div>
        </div>

        {error ? <p className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</p> : null}

        {isLoading ? (
          <p className="text-gray-500">{text.submitting}</p>
        ) : (
          <form onSubmit={submit} className="space-y-6">
            <section className="space-y-4 rounded-2xl bg-white p-8 shadow-sm">
              <label className="block">
                <span className="mb-1 block text-sm font-bold">{text.category}</span>
                <select className={inputClass} value={rootCategoryId} onChange={(e) => setRootCategoryId(e.target.value)} required>
                  <option value="">{text.selectCategory}</option>
                  {rootCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {locale === 'en' ? category.nameEn || category.name : category.nameAr || category.name}
                    </option>
                  ))}
                </select>
              </label>

              <div>
                <h2 className="mb-3 text-lg font-black">{text.plan}</h2>
                {!rootCategoryId ? (
                  <p className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-sm text-gray-500">{text.selectCategoryFirst}</p>
                ) : isLoadingPlans ? (
                  <p className="text-sm text-gray-500">{text.loadingPlans}</p>
                ) : plans.length === 0 ? (
                  <p className="text-sm text-gray-500">{text.noPlans}</p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {plans.map((plan) => (
                      <StorePlanCard
                        key={plan.id}
                        plan={plan}
                        locale={locale}
                        selected={planId === plan.id}
                        billingPeriod={billingPeriod}
                        labels={{
                          billingMonthly: text.billingMonthly,
                          billingYearly: text.billingYearly,
                          freePlan: text.freePlan,
                          maxListings: text.maxListings,
                          trialBadge: text.trialBadge,
                          trialDays: text.trialDays,
                          selectPlan: text.selectPlan
                        }}
                        onSelectPlan={setPlanId}
                        onSelectBilling={(id, period) => {
                          setPlanId(id);
                          setBillingPeriod(period);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="space-y-6 rounded-2xl bg-white p-8 shadow-sm">
              <h2 className="text-lg font-black">{text.storeDetails}</h2>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-sm font-bold">{text.nameAr}</span>
                  <input className={inputClass} value={nameAr} onChange={(e) => setNameAr(e.target.value)} required />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-bold">{text.nameEn}</span>
                  <input dir="ltr" className={inputClass} value={nameEn} onChange={(e) => setNameEn(e.target.value)} required />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-sm font-bold">{text.bioAr}</span>
                  <textarea className={`${inputClass} min-h-24`} value={bioAr} onChange={(e) => setBioAr(e.target.value)} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-bold">{text.bioEn}</span>
                  <textarea dir="ltr" className={`${inputClass} min-h-24`} value={bioEn} onChange={(e) => setBioEn(e.target.value)} />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-sm font-bold">{text.phone}</span>
                  <input dir="ltr" className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} required />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-bold">{text.nationalId}</span>
                  <input dir="ltr" className={inputClass} value={nationalId} onChange={(e) => setNationalId(e.target.value)} required />
                  <span className="mt-1 block text-xs text-gray-500">{text.nationalIdHint}</span>
                </label>
              </div>

              <label className="block">
                <span className="mb-1 block text-sm font-bold">{text.crNumber}</span>
                <input dir="ltr" className={inputClass} value={commercialRegistrationNumber} onChange={(e) => setCommercialRegistrationNumber(e.target.value)} required />
              </label>

              <button
                type="submit"
                disabled={isSubmitting || !planId || !rootCategoryId || plans.length === 0 || isLoadingPlans}
                className="w-full rounded-lg bg-green-600 px-6 py-3 font-bold text-white transition hover:bg-green-700 disabled:opacity-60"
              >
                {isSubmitting ? text.submitting : isTrialEligible ? text.submitTrial : isFreePlan ? text.submitFree : text.submit}
              </button>
            </section>
          </form>
        )}
        </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
