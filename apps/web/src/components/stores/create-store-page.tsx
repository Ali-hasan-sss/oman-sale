'use client';

import { Store } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useMemo, useState } from 'react';

import { SiteFooter } from '@/components/home/site-footer';
import { SiteHeaderSearch, UserSiteHeader } from '@/components/navigation/user-site-header';
import { CreateStoreBillingPeriodCards } from '@/components/stores/create-store-billing-period-cards';
import { CreateStorePlanSelectCard } from '@/components/stores/create-store-plan-select-card';
import { CreateStorePlansSkeleton } from '@/components/stores/create-store-plans-skeleton';
import { PlanPriceWithVat } from '@/components/pricing/plan-price-with-vat';
import { api } from '@/lib/api';
import { resolveApiErrorMessage } from '@/lib/api-errors';
import { buildCategoryTree } from '@/lib/category-tree';
import { useI18n } from '@/lib/i18n';
import { getWilayahsForGovernorate, omanGovernorates } from '@/lib/oman-locations';
import { getUserAccessToken } from '@/lib/user-auth';
import { canActivateStorePlanWithoutPayment } from '@/lib/store-plan-activation';
import { getBillingPeriodLabel, type StoreBillingPeriod } from '@/lib/store-billing-period';

type RootCategory = {
  id: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  parentId?: string | null;
};

type StorePlanPricing = {
  id: string;
  billingPeriod: StoreBillingPeriod;
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
  isAdminFree?: boolean;
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
    storeType: 'نوع المتجر *',
    selectStoreType: 'اختر نوع المتجر',
    city: 'المحافظة *',
    selectCity: 'اختر المحافظة',
    wilayah: 'الولاية / المنطقة *',
    selectWilayah: 'اختر الولاية',
    phone: 'رقم التواصل *',
    nationalId: 'رقم الهوية / جواز السفر *',
    nationalIdHint: 'البطاقة الشخصية العمانية أو جواز السفر',
    crNumber: 'رقم السجل التجاري *',
    storeClassification: 'تصنيف المتجر *',
    commercialStore: 'متجر تجاري رسمي',
    commercialStoreHint: 'يتطلب إدخال رقم السجل التجاري',
    homeBusiness: 'أعمال منزلية',
    homeBusinessHint: 'يكفي إدخال رقم الهوية أو جواز السفر',
    plan: 'خطة الاشتراك *',
    storeDetails: 'بيانات المتجر',
    billingMonthly: 'شهري',
    billingYearly: 'سنوي',
    freePlan: 'مجاناً',
    maxListings: 'حد العروض',
    perMonth: 'شهرياً',
    perYear: 'سنوياً',
    submit: 'متابعة الدفع',
    activatePlan: 'تفعيل الخطة',
    submitTrial: 'بدء الفترة التجريبية',
    submitting: 'جاري المعالجة...',
    selectedPlanSummary: 'الخطة المختارة',
    planPrice: 'سعر الخطة',
    loginRequired: 'يجب تسجيل الدخول أولاً',
    loadError: 'تعذر تحميل البيانات.',
    createError: 'تعذر إنشاء المتجر. تحقق من البيانات وحاول مرة أخرى.',
    noPlans: 'لا توجد خطط متاحة لهذه الفئة حالياً.',
    loadingPlans: 'جاري تحميل الخطط...',
    selectCategoryFirst: 'اختر الفئة الرئيسية لعرض خطط الاشتراك والأسعار.',
    trialBadge: 'تجربة مجانية',
    trialDays: 'يوم تجريبي',
    selectPlan: 'اختيار الخطة',
    selectPeriod: 'اختر مدة الاشتراك',
    selectPeriodHint: 'حدّد مدة الاشتراك المناسبة لمتجرك.',
    discount: 'خصم',
    alreadyHasStore: 'لديك متجر مرتبط بحسابك بالفعل.',
    vatShort: 'ضريبة القيمة المضافة',
    adminFreeBadge: 'مجانية (شهر واحد)',
    paymentComingSoon: 'سيتم توفر التفعيل المدفوع قريباً. يمكنك استخدام الفترة التجريبية إن كانت متاحة.',
    submitPaymentComingSoon: 'التفعيل المدفوع قريباً'
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
    storeType: 'Store type *',
    selectStoreType: 'Select store type',
    city: 'Governorate *',
    selectCity: 'Select governorate',
    wilayah: 'Wilayah *',
    selectWilayah: 'Select wilayah',
    phone: 'Contact phone *',
    nationalId: 'National ID / Passport *',
    nationalIdHint: 'Omani civil ID or passport number',
    crNumber: 'Commercial registration number *',
    storeClassification: 'Store classification *',
    commercialStore: 'Official commercial store',
    commercialStoreHint: 'Requires a commercial registration number',
    homeBusiness: 'Home business',
    homeBusinessHint: 'National ID or passport is enough',
    plan: 'Subscription plan *',
    storeDetails: 'Store details',
    freePlan: 'Free',
    maxListings: 'Listing limit',
    perMonth: 'per month',
    perYear: 'per year',
    submit: 'Proceed to payment',
    activatePlan: 'Activate plan',
    submitTrial: 'Start free trial',
    submitting: 'Processing...',
    selectedPlanSummary: 'Selected plan',
    planPrice: 'Plan price',
    loginRequired: 'Please log in first',
    loadError: 'Could not load page data.',
    createError: 'Could not create the store. Check your details and try again.',
    noPlans: 'No plans are available for this category yet.',
    loadingPlans: 'Loading plans...',
    selectCategoryFirst: 'Select a main category to view subscription plans and prices.',
    trialBadge: 'Free trial',
    trialDays: 'trial days',
    selectPlan: 'Select plan',
    selectPeriod: 'Choose subscription period',
    selectPeriodHint: 'Pick the subscription period that works best for your store.',
    discount: 'Discount',
    alreadyHasStore: 'You already have a store linked to your account.',
    vatShort: 'VAT',
    adminFreeBadge: 'Free (1 month)',
    paymentComingSoon: 'Paid activation will be available soon. You can start the free trial if available.',
    submitPaymentComingSoon: 'Paid activation coming soon'
  }
} as const;

export function CreateStorePage() {
  const router = useRouter();
  const { dir, locale, localizedPath, m } = useI18n();
  const text = labels[locale];

  const [categories, setCategories] = useState<RootCategory[]>([]);
  const [storeTypes, setStoreTypes] = useState<Array<{ id: string; nameAr: string; nameEn: string }>>([]);
  const [plans, setPlans] = useState<StorePlan[]>([]);
  const [rootCategoryId, setRootCategoryId] = useState('');
  const [storeTypeId, setStoreTypeId] = useState('');
  const [city, setCity] = useState('');
  const [wilayah, setWilayah] = useState('');
  const [planId, setPlanId] = useState('');
  const [billingPeriod, setBillingPeriod] = useState<StoreBillingPeriod | ''>('');
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [bioAr, setBioAr] = useState('');
  const [bioEn, setBioEn] = useState('');
  const [phone, setPhone] = useState('');
  const [businessType, setBusinessType] = useState<'COMMERCIAL' | 'HOME' | ''>('');
  const [nationalId, setNationalId] = useState('');
  const [commercialRegistrationNumber, setCommercialRegistrationNumber] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingMode, setSubmittingMode] = useState<'trial' | 'plan' | null>(null);
  const [hasExistingStore, setHasExistingStore] = useState(false);

  const rootCategories = useMemo(() => buildCategoryTree(categories), [categories]);

  const wilayahOptions = useMemo(() => (city ? getWilayahsForGovernorate(city) : []), [city]);

  const selectedPlan = plans.find((plan) => plan.id === planId);
  const selectedPricing = selectedPlan?.pricing.find((row) => row.billingPeriod === billingPeriod);
  const finalPrice = Number(selectedPricing?.finalPrice ?? selectedPricing?.price ?? 0);
  const canActivateFree = Boolean(
    selectedPlan &&
      billingPeriod &&
      canActivateStorePlanWithoutPayment(selectedPlan, billingPeriod, finalPrice)
  );
  const isTrialEligible = Boolean(selectedPlan?.trialAvailable && selectedPlan.trialDays && selectedPlan.trialDays > 0);
  const planActivationBlocked = Boolean(selectedPlan && billingPeriod && !canActivateFree);
  const selectedPlanName = selectedPlan ? (locale === 'en' ? selectedPlan.nameEn : selectedPlan.nameAr) : '';
  const displayPrice = canActivateFree ? 0 : finalPrice;

  const isFormComplete = Boolean(
    planId &&
      billingPeriod &&
      rootCategoryId &&
      storeTypeId &&
      city &&
      wilayah &&
      businessType &&
      nameAr.trim() &&
      nameEn.trim() &&
      phone.trim() &&
      nationalId.trim() &&
      (businessType !== 'COMMERCIAL' || commercialRegistrationNumber.trim()) &&
      plans.length > 0 &&
      !isLoadingPlans
  );

  const handleSelectPlan = (id: string) => {
    setPlanId(id);
    setBillingPeriod('');
  };

  useEffect(() => {
    const token = getUserAccessToken();
    if (!token) {
      router.replace(localizedPath('/login'));
      return;
    }

    api
      .get<{ data: RootCategory[] }>('/categories', { params: { locale, includeInactive: false } })
      .then((response) => setCategories(response.data.data))
      .catch(() => setError(text.loadError));

    api
      .get<{ data: Array<{ id: string; nameAr: string; nameEn: string }> }>('/store-types')
      .then((response) => setStoreTypes(response.data.data))
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
        setPlanId('');
        setBillingPeriod('');
      })
      .catch(() => setError(text.loadError))
      .finally(() => setIsLoadingPlans(false));
  }, [rootCategoryId, text.loadError]);

  const submitStore = async (activationMode: 'trial' | 'plan') => {
    if (!isFormComplete) return;

    setError('');
    setIsSubmitting(true);
    setSubmittingMode(activationMode);

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
          businessType,
          ...(businessType === 'COMMERCIAL'
            ? { commercialRegistrationNumber: commercialRegistrationNumber.trim() }
            : {}),
          rootCategoryId,
          storeTypeId,
          city,
          wilayah,
          planId,
          billingPeriod,
          activationMode
        },
        { params: { locale } }
      );

      const paymentUrl = response.data.data.checkout?.paymentUrl;
      if (response.data.data.requiresPayment && paymentUrl) {
        window.location.href = paymentUrl;
        return;
      }

      router.push(localizedPath('/my-store'));
    } catch (submitError) {
      setError(
        resolveApiErrorMessage(
          submitError,
          {
            ACCOUNT_BLOCKED: m.errors.ACCOUNT_BLOCKED,
            ACCOUNT_INACTIVE: m.errors.ACCOUNT_INACTIVE,
            STORE_LIMIT_REACHED: m.errors.STORE_LIMIT_REACHED,
            PAYMENT_COMING_SOON: m.errors.PAYMENT_COMING_SOON
          },
          text.createError
        )
      );
    } finally {
      setIsSubmitting(false);
      setSubmittingMode(null);
    }
  };

  const preventFormSubmit = (event: FormEvent) => {
    event.preventDefault();
  };

  const inputClass = 'w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-green-500';

  return (
    <div className="site-page-shell bg-gray-50" dir={dir}>
      <UserSiteHeader>
        <div className="hidden max-w-xl md:block">
          <SiteHeaderSearch />
        </div>
      </UserSiteHeader>

      <main className="mx-auto max-w-6xl px-4 py-10">
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
          <form onSubmit={preventFormSubmit} className="space-y-6">
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

              <label className="block">
                <span className="mb-1 block text-sm font-bold">{text.storeType}</span>
                <select className={inputClass} value={storeTypeId} onChange={(e) => setStoreTypeId(e.target.value)} required>
                  <option value="">{text.selectStoreType}</option>
                  {storeTypes.map((storeType) => (
                    <option key={storeType.id} value={storeType.id}>
                      {locale === 'en' ? storeType.nameEn : storeType.nameAr}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-bold">{text.city}</span>
                <select
                  className={inputClass}
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    setWilayah('');
                  }}
                  required
                >
                  <option value="">{text.selectCity}</option>
                  {omanGovernorates.map((governorate) => (
                    <option key={governorate.value} value={governorate.value}>
                      {locale === 'en' ? governorate.en : governorate.ar}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-bold">{text.wilayah}</span>
                <select
                  className={inputClass}
                  value={wilayah}
                  onChange={(e) => setWilayah(e.target.value)}
                  required
                  disabled={!city}
                >
                  <option value="">{text.selectWilayah}</option>
                  {wilayahOptions.map((wilayahOption) => (
                    <option key={wilayahOption.value} value={wilayahOption.value}>
                      {locale === 'en' ? wilayahOption.en : wilayahOption.ar}
                    </option>
                  ))}
                </select>
              </label>

              <div>
                <h2 className="mb-3 text-lg font-black">{text.plan}</h2>
                {!rootCategoryId ? (
                  <p className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-sm text-gray-500">{text.selectCategoryFirst}</p>
                ) : isLoadingPlans ? (
                  <CreateStorePlansSkeleton />
                ) : plans.length === 0 ? (
                  <p className="text-sm text-gray-500">{text.noPlans}</p>
                ) : (
                  <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {plans.map((plan) => (
                        <CreateStorePlanSelectCard
                          key={plan.id}
                          plan={plan}
                          locale={locale}
                          selected={planId === plan.id}
                          labels={{
                            trialBadge: text.trialBadge,
                            trialDays: text.trialDays,
                            maxListings: text.maxListings,
                            adminFreeBadge: text.adminFreeBadge,
                            selectPlan: text.selectPlan
                          }}
                          onSelect={handleSelectPlan}
                        />
                      ))}
                    </div>

                    {selectedPlan ? (
                      <div className="space-y-3 border-t border-gray-100 pt-6">
                        <div>
                          <h3 className="text-base font-black text-gray-900">{text.selectPeriod}</h3>
                          <p className="mt-1 text-sm text-gray-500">{text.selectPeriodHint}</p>
                        </div>
                        <CreateStoreBillingPeriodCards
                          plan={selectedPlan}
                          pricing={selectedPlan.pricing}
                          locale={locale}
                          selectedPeriod={billingPeriod}
                          labels={{
                            freePlan: text.freePlan,
                            maxListings: text.maxListings,
                            vatShort: text.vatShort,
                            discount: text.discount
                          }}
                          onSelect={setBillingPeriod}
                        />
                      </div>
                    ) : null}
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

              <div>
                <span className="mb-3 block text-sm font-bold">{text.storeClassification}</span>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      setBusinessType('COMMERCIAL');
                    }}
                    className={`rounded-xl border-2 p-4 text-start transition ${
                      businessType === 'COMMERCIAL'
                        ? 'border-green-600 bg-green-50 ring-2 ring-green-100'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <span className="block font-bold text-gray-900">{text.commercialStore}</span>
                    <span className="mt-1 block text-xs text-gray-500">{text.commercialStoreHint}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBusinessType('HOME');
                      setCommercialRegistrationNumber('');
                    }}
                    className={`rounded-xl border-2 p-4 text-start transition ${
                      businessType === 'HOME'
                        ? 'border-green-600 bg-green-50 ring-2 ring-green-100'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <span className="block font-bold text-gray-900">{text.homeBusiness}</span>
                    <span className="mt-1 block text-xs text-gray-500">{text.homeBusinessHint}</span>
                  </button>
                </div>
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

              {businessType === 'COMMERCIAL' ? (
                <label className="block">
                  <span className="mb-1 block text-sm font-bold">{text.crNumber}</span>
                  <input
                    dir="ltr"
                    className={inputClass}
                    value={commercialRegistrationNumber}
                    onChange={(e) => setCommercialRegistrationNumber(e.target.value)}
                    required
                  />
                </label>
              ) : null}

              {selectedPlan && billingPeriod ? (
                <div className="rounded-2xl border border-green-100 bg-green-50/60 p-5">
                  <p className="text-sm font-bold text-green-800">{text.selectedPlanSummary}</p>
                  <p className="mt-1 text-lg font-black text-gray-900">{selectedPlanName}</p>
                  <p className="mt-1 text-sm text-gray-600">{getBillingPeriodLabel(billingPeriod, locale)}</p>
                  <div className="mt-3">
                    <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">
                      {text.planPrice}
                    </span>
                    <PlanPriceWithVat
                      basePrice={displayPrice}
                      locale={locale}
                      freeLabel={text.freePlan}
                      vatShort={text.vatShort}
                      mainClassName="text-2xl font-black text-green-700"
                      subClassName="mt-1 block text-sm font-normal text-gray-600"
                    />
                  </div>
                </div>
              ) : null}

              {billingPeriod && planActivationBlocked ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  {text.paymentComingSoon}
                </p>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                {isTrialEligible ? (
                  <button
                    type="button"
                    disabled={isSubmitting || !isFormComplete}
                    onClick={() => submitStore('trial')}
                    className="w-full rounded-lg border-2 border-green-600 bg-white px-6 py-3 font-bold text-green-700 transition hover:bg-green-50 disabled:opacity-60"
                  >
                    {isSubmitting && submittingMode === 'trial' ? text.submitting : text.submitTrial}
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={isSubmitting || !isFormComplete || planActivationBlocked}
                  onClick={() => submitStore('plan')}
                  className={`w-full rounded-lg bg-green-600 px-6 py-3 font-bold text-white transition hover:bg-green-700 disabled:opacity-60 ${
                    !isTrialEligible ? 'sm:col-span-2' : ''
                  }`}
                >
                  {isSubmitting && submittingMode === 'plan'
                    ? text.submitting
                    : planActivationBlocked
                      ? text.submitPaymentComingSoon
                      : canActivateFree
                        ? text.activatePlan
                        : text.submit}
                </button>
              </div>
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
