'use client';

import { Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ListingAdMediaUploader } from '@/components/listings/listing-ad-media-uploader';
import { SiteFooter } from '@/components/home/site-footer';
import { SiteHeaderSearch, UserSiteHeader } from '@/components/navigation/user-site-header';
import { api } from '@/lib/api';
import { getValidationFieldErrors, resolveApiErrorMessage } from '@/lib/api-errors';
import { storePendingThawaniSession } from '@/lib/thawani-session';
import { buildCategoryTree, flattenCategoryTreeWithPath } from '@/lib/category-tree';
import {
  parseListingPrice,
  sanitizePriceInput,
  validateListingForm
} from '@/lib/listing-form-validation';
import { useI18n } from '@/lib/i18n';
import { getWilayahsForGovernorate, omanGovernorates } from '@/lib/oman-locations';
import { PlanPriceWithVat } from '@/components/pricing/plan-price-with-vat';
import { getUserAccessToken } from '@/lib/user-auth';
import { useAuthStore } from '@/store/auth-store';

type Category = {
  id: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  parentId?: string | null;
  type: 'PRODUCT' | 'SERVICE' | 'JOB' | 'JOB_REQUEST' | 'LOGISTICS' | 'CONSTRUCTION';
};

type PromotionPlan = {
  id: string;
  name?: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  pricePerDay?: string | number;
  weekPrice: string | number;
  twoWeeksPrice: string | number;
  monthPrice: string | number;
  badgeLabel?: string | null;
  color?: string | null;
};

type CreatedAd = {
  id: string;
};

type OwnerStore = {
  id: string;
  nameAr: string;
  nameEn: string;
  accessStatus: 'ACTIVE' | 'TRIAL' | 'TRIAL_EXPIRED' | 'SUBSCRIPTION_EXPIRED' | 'DISABLED';
  isActive: boolean;
};

type PublishSource = 'store' | 'personal';

const labels = {
  ar: {
    title: 'أضف إعلانك',
    subtitle: 'املأ البيانات التالية لنشر إعلانك',
    adTitle: 'عنوان الإعلان *',
    titlePlaceholder: 'مثال: تويوتا كامري 2023 للبيع',
    category: 'الفئة *',
    selectCategory: 'اختر الفئة',
    city: 'المحافظة *',
    selectCity: 'اختر المحافظة',
    wilayah: 'الولاية / المنطقة *',
    selectWilayah: 'اختر الولاية',
    price: 'السعر (ر.ع) *',
    pricePlaceholder: 'مثال: 12,500',
    description: 'الوصف *',
    descriptionPlaceholder: 'اكتب وصفاً تفصيلياً للإعلان...',
    images: 'الصور',
    video: 'فيديو الإعلان',
    videoTitle: 'اضغط لرفع فيديو قصير للإعلان',
    videoHint: 'اختياري — يُضغط تلقائياً ثم يُرفع (حد أقصى 10MB بعد الضغط)',
    uploadTitle: 'اضغط لرفع الصور أو اسحبها هنا',
    uploadHint: 'حتى 8 صور — يُضغط كل ملف تلقائياً (حد أقصى 10MB بعد الضغط)',
    uploadError: 'تعذر رفع الملف. حاول مرة أخرى.',
    uploading: 'جاري رفع الملفات...',
    compressing: 'جاري ضغط الملف...',
    removeImage: 'إزالة الصورة',
    adType: 'نوع الإعلان',
    adTypeSubtitle: 'اختر نوع الإعلان المناسب لك',
    normalAd: 'إعلان عادي',
    normalDescription: 'مجاني',
    promotionPlansEmpty: 'لا توجد خطط ترويج متاحة حالياً.',
    free: 'مجاني',
    duration: 'مدة الترويج',
    oneWeek: 'أسبوع واحد',
    twoWeeks: 'أسبوعين',
    oneMonth: 'شهر واحد',
    publish: 'نشر الإعلان',
    proceedToPayment: 'متابعة الدفع',
    publishing: 'جاري النشر...',
    cancel: 'إلغاء',
    loadError: 'تعذر تحميل بيانات الصفحة.',
    createError: 'تعذر نشر الإعلان. تحقق من البيانات وحاول مرة أخرى.',
    success: 'تم نشر الإعلان بنجاح.',
    publishAs: 'النشر باسم',
    publishAsHint: 'اختر ما إذا كان الإعلان يُعرض باسم متجرك أو حسابك الشخصي',
    publishFromStore: 'النشر من المتجر',
    publishFromStoreHint: 'يُعرض الإعلان باسم المتجر ويستفيد من مزايا خطة المتجر',
    publishFromPersonal: 'النشر من حسابي الشخصي',
    publishFromPersonalHint: 'يُعرض الإعلان باسمك ويتطلب الدفع للتمييز مثل أي مستخدم',
    vatShort: 'ضريبة القيمة المضافة'
  },
  en: {
    title: 'Post Your Ad',
    subtitle: 'Fill in the following details to publish your listing',
    adTitle: 'Listing title *',
    titlePlaceholder: 'Example: Toyota Camry 2023 for sale',
    category: 'Category *',
    selectCategory: 'Select category',
    city: 'Governorate *',
    selectCity: 'Select governorate',
    wilayah: 'Wilayah *',
    selectWilayah: 'Select wilayah',
    price: 'Price (OMR) *',
    pricePlaceholder: 'Example: 12,500',
    description: 'Description *',
    descriptionPlaceholder: 'Write a detailed description for your listing...',
    images: 'Images',
    video: 'Listing video',
    videoTitle: 'Click to upload a short listing video',
    videoHint: 'Optional — auto-compressed before upload (10MB max after compression)',
    uploadTitle: 'Click to upload images or drag them here',
    uploadHint: 'Up to 8 images — each file is auto-compressed (10MB max after compression)',
    uploadError: 'Could not upload file. Please try again.',
    uploading: 'Uploading files...',
    compressing: 'Compressing file...',
    removeImage: 'Remove image',
    adType: 'Ad type',
    adTypeSubtitle: 'Choose the right ad type for you',
    normalAd: 'Normal ad',
    normalDescription: 'Free',
    promotionPlansEmpty: 'No promotion plans are available right now.',
    free: 'Free',
    duration: 'Promotion duration',
    oneWeek: 'One week',
    twoWeeks: 'Two weeks',
    oneMonth: 'One month',
    publish: 'Publish listing',
    publishing: 'Publishing...',
    cancel: 'Cancel',
    loadError: 'Could not load page data.',
    createError: 'Could not publish listing. Check your details and try again.',
    success: 'Listing published successfully.',
    publishAs: 'Publish as',
    publishAsHint: 'Choose whether the listing appears under your store or personal account',
    publishFromStore: 'Publish from store',
    publishFromStoreHint: 'Listing appears under your store name with plan benefits',
    publishFromPersonal: 'Publish from personal account',
    publishFromPersonalHint: 'Listing appears under your name and paid promotion applies',
    proceedToPayment: 'Continue to payment',
    vatShort: 'VAT'
  }
};

const durationOptions = [
  { days: 7, labelKey: 'oneWeek' },
  { days: 14, labelKey: 'twoWeeks' },
  { days: 30, labelKey: 'oneMonth' }
] as const;

const SCROLL_HEADER_OFFSET = 220;
const SCROLL_EXTRA_PADDING = 80;

export function AddListingPage() {
  const router = useRouter();
  const { dir, locale, localizedPath, m } = useI18n();
  const text = labels[locale];
  const hydrateFromStorage = useAuthStore((state) => state.hydrateFromStorage);
  const [categories, setCategories] = useState<Category[]>([]);
  const [plans, setPlans] = useState<PromotionPlan[]>([]);
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [city, setCity] = useState('');
  const [wilayah, setWilayah] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [duration, setDuration] = useState(7);
  const [ownerStore, setOwnerStore] = useState<OwnerStore | null>(null);
  const [publishSource, setPublishSource] = useState<PublishSource>('personal');
  const [isPageDataLoading, setIsPageDataLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const errorBannerRef = useRef<HTMLDivElement>(null);

  const validationMessages = useMemo(
    () => ({
      titleRequired: m.errors.fieldTitleRequired,
      titleMin: m.errors.fieldTitleMin,
      descriptionRequired: m.errors.fieldDescriptionRequired,
      descriptionMin: m.errors.fieldDescriptionMin,
      categoryRequired: m.errors.fieldCategoryRequired,
      cityRequired: m.errors.fieldCityRequired,
      wilayahRequired: m.errors.fieldWilayahRequired,
      priceRequired: m.errors.fieldPriceRequired,
      priceInvalid: m.errors.fieldPriceInvalid
    }),
    [m.errors]
  );

  const scrollToErrors = useCallback(() => {
    const runScroll = () => {
      const target = errorBannerRef.current;
      if (!target) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      const top =
        target.getBoundingClientRect().top +
        window.scrollY -
        SCROLL_HEADER_OFFSET -
        SCROLL_EXTRA_PADDING;

      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    };

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(runScroll);
    });
    window.setTimeout(runScroll, 180);
    window.setTimeout(runScroll, 360);
  }, []);

  useEffect(() => {
    if (error) scrollToErrors();
  }, [error, scrollToErrors]);

  const clearFieldError = (field: string) => {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);
  const selectedCategory = categories.find((category) => category.id === categoryId);
  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId);
  const canPublishFromStore = Boolean(
    ownerStore &&
      ownerStore.isActive &&
      (ownerStore.accessStatus === 'ACTIVE' || ownerStore.accessStatus === 'TRIAL')
  );
  const isStorePublish = canPublishFromStore && publishSource === 'store';
  const selectedPromotionPrice = selectedPlan ? getPlanPrice(selectedPlan, duration) : 0;
  const requiresPaidPromotion = !isStorePublish && Boolean(selectedPlan) && selectedPromotionPrice > 0;
  const authHeaders = useMemo(() => {
    const token = getUserAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : undefined;
  }, []);
  const wilayahOptions = useMemo(() => (city ? getWilayahsForGovernorate(city) : []), [city]);
  const inputClass = 'w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-green-500';

  function fieldInputClass(fieldError?: string) {
    return fieldError
      ? `${inputClass} border-red-400 focus:ring-red-400`
      : inputClass;
  }

  useEffect(() => {
    hydrateFromStorage();
    const token = getUserAccessToken();
    if (!token) {
      router.replace(localizedPath('/login'));
      return;
    }

    Promise.all([
      api.get<{ data: Category[] }>(`/categories?locale=${locale}`),
      api.get<{ data: PromotionPlan[] }>('/promotions/plans'),
      api.get<{ data: OwnerStore[] }>('/stores/me', { headers: authHeaders })
    ])
      .then(([categoriesResponse, plansResponse, storesResponse]) => {
        const promotionPlans = plansResponse.data.data;
        const activeStore = storesResponse.data.data.find(
          (store) =>
            store.isActive && (store.accessStatus === 'ACTIVE' || store.accessStatus === 'TRIAL')
        );
        setCategories(categoriesResponse.data.data);
        setPlans(promotionPlans);
        setOwnerStore(activeStore ?? storesResponse.data.data[0] ?? null);
        if (activeStore) {
          setPublishSource('store');
          setSelectedPlanId('');
        } else {
          setSelectedPlanId((current) => current || promotionPlans[0]?.id || '');
        }
      })
      .catch(() => setError(text.loadError))
      .finally(() => setIsPageDataLoading(false));
  }, [locale]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextFieldErrors = validateListingForm(
      { title, description, categoryId, city, wilayah, price },
      validationMessages
    );

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setError(m.errors.VALIDATION_FAILED);
      setMessage('');
      return;
    }

    if (!selectedCategory) return;

    setError('');
    setMessage('');
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const adPayload = {
        title: title.trim(),
        description: description.trim(),
        type: selectedCategory.type,
        price: parseListingPrice(price),
        currency: 'OMR',
        city,
        wilayah,
        categoryId,
        imageUrls,
        videoUrl: videoUrl ?? undefined,
        ...(isStorePublish && ownerStore ? { storeId: ownerStore.id } : {})
      };

      if (selectedPlan && !isStorePublish) {
        const promotionResponse = await api.post<{
          data: { checkout?: { paymentUrl?: string; sessionId?: string; paid?: boolean } };
        }>(
          '/checkout/paid-listings',
          {
            ad: adPayload,
            planId: selectedPlan.id,
            days: duration
          },
          { headers: authHeaders, params: { locale } }
        );

        const paymentUrl = promotionResponse.data.data.checkout?.paymentUrl;
        const sessionId = promotionResponse.data.data.checkout?.sessionId;
        if (paymentUrl) {
          if (sessionId) storePendingThawaniSession(sessionId);
          window.location.href = paymentUrl;
          return;
        }

        setMessage(text.success);
        router.push(localizedPath('/my-listings'));
        return;
      }

      await api.post<{ data: CreatedAd }>('/ads', adPayload, { headers: authHeaders });

      setMessage(text.success);
      router.push(localizedPath('/my-listings'));
    } catch (submitError) {
      const apiFieldErrors = getValidationFieldErrors(submitError, m.errors);
      if (Object.keys(apiFieldErrors).length > 0) {
        setFieldErrors(apiFieldErrors);
      }
      setError(resolveApiErrorMessage(submitError, m.errors, text.createError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="site-page-shell bg-gray-50" dir={dir}>
      <UserSiteHeader>
        <SiteHeaderSearch />
      </UserSiteHeader>

      <main className="site-container site-page-main site-page-main--narrow min-w-0">
        <div ref={errorBannerRef} className="scroll-mt-56">
          {error ? (
            <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600 sm:mb-6">{error}</p>
          ) : null}
          {message ? (
            <p className="mb-4 rounded-xl bg-green-50 px-4 py-3 text-sm font-bold text-green-700 sm:mb-6">{message}</p>
          ) : null}
        </div>

        <div className="mb-6 sm:mb-8">
          <h1 className="mb-2 text-2xl font-bold sm:text-3xl">{text.title}</h1>
          <p className="text-sm text-gray-600 sm:text-base">{text.subtitle}</p>
        </div>

        <form onSubmit={submit} className="min-w-0 rounded-2xl bg-white p-4 shadow-sm sm:p-6 lg:p-8">
          <Field error={fieldErrors.title} label={text.adTitle}>
            <input
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                clearFieldError('title');
              }}
              type="text"
              placeholder={text.titlePlaceholder}
              className={fieldInputClass(fieldErrors.title)}
            />
          </Field>

          <Field error={fieldErrors.categoryId} label={text.category}>
            <select
              value={categoryId}
              onChange={(event) => {
                setCategoryId(event.target.value);
                clearFieldError('categoryId');
              }}
              className={fieldInputClass(fieldErrors.categoryId)}
            >
              <option value="">{text.selectCategory}</option>
              {categoryTree.map((root) => (
                <optgroup key={root.id} label={root.name}>
                  {flattenCategoryTreeWithPath([root], (category) => category.name).map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </Field>

          <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <Field error={fieldErrors.city} label={text.city}>
              <select
                value={city}
                onChange={(event) => {
                  setCity(event.target.value);
                  setWilayah('');
                  clearFieldError('city');
                  clearFieldError('wilayah');
                }}
                className={fieldInputClass(fieldErrors.city)}
              >
                <option value="">{text.selectCity}</option>
                {omanGovernorates.map((governorate) => (
                  <option key={governorate.value} value={governorate.value}>
                    {locale === 'en' ? governorate.en : governorate.ar}
                  </option>
                ))}
              </select>
            </Field>
            <Field error={fieldErrors.wilayah} label={text.wilayah}>
              <select
                value={wilayah}
                onChange={(event) => {
                  setWilayah(event.target.value);
                  clearFieldError('wilayah');
                }}
                disabled={!city}
                className={fieldInputClass(fieldErrors.wilayah)}
              >
                <option value="">{text.selectWilayah}</option>
                {wilayahOptions.map((wilayahOption) => (
                  <option key={wilayahOption.value} value={wilayahOption.value}>
                    {locale === 'en' ? wilayahOption.en : wilayahOption.ar}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field error={fieldErrors.price} label={text.price}>
            <input
              value={price}
              onChange={(event) => {
                setPrice(sanitizePriceInput(event.target.value));
                clearFieldError('price');
              }}
              type="text"
              inputMode="decimal"
              placeholder={text.pricePlaceholder}
              className={fieldInputClass(fieldErrors.price)}
            />
          </Field>

          <Field error={fieldErrors.description} label={text.description}>
            <textarea
              value={description}
              onChange={(event) => {
                setDescription(event.target.value);
                clearFieldError('description');
              }}
              rows={6}
              placeholder={text.descriptionPlaceholder}
              className={fieldInputClass(fieldErrors.description)}
            />
          </Field>

          <div className="mb-6">
            <ListingAdMediaUploader
              imageUrls={imageUrls}
              videoUrl={videoUrl}
              onImageUrlsChange={setImageUrls}
              onVideoUrlChange={setVideoUrl}
              labels={{
                imagesTitle: text.uploadTitle,
                imagesHint: text.uploadHint,
                videoTitle: text.videoTitle,
                videoHint: text.videoHint,
                remove: text.removeImage,
                uploading: text.uploading,
                compressing: text.compressing,
                uploadError: text.uploadError
              }}
            />
          </div>

          {isPageDataLoading ? (
            <AddListingPublishSectionSkeleton />
          ) : canPublishFromStore ? (
            <div className="mb-6 rounded-lg bg-gray-50 p-4 sm:p-6">
              <h3 className="mb-2 text-xl font-bold">{text.publishAs}</h3>
              <p className="mb-4 text-gray-600">{text.publishAsHint}</p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <PublishSourceCard
                  active={publishSource === 'store'}
                  title={text.publishFromStore}
                  description={text.publishFromStoreHint}
                  badge={locale === 'en' ? ownerStore?.nameEn : ownerStore?.nameAr}
                  onClick={() => {
                    setPublishSource('store');
                    setSelectedPlanId('');
                  }}
                />
                <PublishSourceCard
                  active={publishSource === 'personal'}
                  title={text.publishFromPersonal}
                  description={text.publishFromPersonalHint}
                  onClick={() => {
                    setPublishSource('personal');
                    setSelectedPlanId((current) => current || plans[0]?.id || '');
                  }}
                />
              </div>
            </div>
          ) : null}

          {isPageDataLoading ? null : !isStorePublish ? (
          <div className="mb-6 min-w-0 rounded-lg bg-gray-50 p-4 sm:p-6">
            <h3 className="mb-2 text-xl font-bold">{text.adType}</h3>
            <p className="mb-4 text-gray-600">{text.adTypeSubtitle}</p>
            <div className="mb-6 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {plans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  active={selectedPlanId === plan.id}
                  description={locale === 'en' ? plan.descriptionEn : plan.descriptionAr}
                  name={locale === 'en' ? plan.nameEn : plan.nameAr}
                  badgeLabel={plan.badgeLabel}
                  color={plan.color}
                  basePrice={getPlanPrice(plan, duration)}
                  freeLabel={text.free}
                  vatShort={text.vatShort}
                  locale={locale}
                  onClick={() => setSelectedPlanId(plan.id)}
                />
              ))}
            </div>

            {plans.length === 0 ? (
              <p className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-3 text-sm text-gray-500">
                {text.promotionPlansEmpty}
              </p>
            ) : null}

            {selectedPlan ? (
              <div className="mb-6">
                <label className="mb-3 block font-bold">{text.duration}</label>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {durationOptions.map((option) => {
                    const active = duration === option.days;

                    return (
                      <button
                        key={option.days}
                        type="button"
                        onClick={() => setDuration(option.days)}
                        className={`relative cursor-pointer rounded-lg border-2 p-4 text-center transition ${
                          active ? 'border-green-600 bg-green-50' : 'border-gray-200 bg-white hover:border-green-300'
                        }`}
                      >
                        {active ? (
                          <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-white">
                            <Check className="h-4 w-4" />
                          </span>
                        ) : null}
                        <span className="block font-bold">{text[option.labelKey]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
          ) : (
            <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 sm:p-6">
              <h3 className="mb-2 text-xl font-bold">{text.publishFromStore}</h3>
              <p className="text-gray-700">{text.publishFromStoreHint}</p>
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-green-600 px-6 py-3 font-bold text-white transition hover:bg-green-700 disabled:opacity-70"
            >
              {isSubmitting ? text.publishing : requiresPaidPromotion ? text.proceedToPayment : text.publish}
            </button>
            <button type="button" onClick={() => router.push(localizedPath('/my-listings'))} className="rounded-lg border border-gray-300 px-6 py-3 transition hover:bg-gray-50">
              {text.cancel}
            </button>
          </div>
        </form>
      </main>

      <SiteFooter />
    </div>
  );
}

function AddListingPublishSectionSkeleton() {
  return (
    <div className="mb-6 min-w-0 rounded-lg bg-gray-50 p-4 sm:p-6" aria-hidden="true">
      <div className="mb-4 h-6 w-40 animate-pulse rounded-full bg-slate-200" />
      <div className="mb-6 h-4 w-full max-w-md animate-pulse rounded-full bg-slate-200" />
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-36 animate-pulse rounded-lg border-2 border-gray-200 bg-white" />
        ))}
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-14 animate-pulse rounded-lg border-2 border-gray-200 bg-white" />
        ))}
      </div>
    </div>
  );
}

function Field({ children, error, label }: { children: ReactNode; error?: string; label: string }) {
  return (
    <div className="mb-6">
      <label className="mb-2 block">{label}</label>
      {children}
      {error ? <p className="mt-2 text-sm font-medium text-red-600">{error}</p> : null}
    </div>
  );
}

function PublishSourceCard({
  active,
  badge,
  description,
  onClick,
  title
}: {
  active: boolean;
  badge?: string;
  description: string;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative rounded-lg border-2 p-4 text-start transition ${
        active ? 'border-green-600 bg-green-50' : 'border-gray-200 bg-white hover:border-green-300'
      }`}
    >
      {active ? (
        <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-white">
          <Check className="h-4 w-4" />
        </div>
      ) : null}
      <h4 className="mb-1 font-bold">{title}</h4>
      {badge ? <p className="mb-2 text-sm font-bold text-green-700">{badge}</p> : null}
      <p className="text-sm text-gray-600">{description}</p>
    </button>
  );
}

function PlanCard({
  active,
  badgeLabel,
  basePrice,
  color,
  description,
  freeLabel,
  locale,
  name,
  onClick,
  vatShort
}: {
  active: boolean;
  badgeLabel?: string | null;
  basePrice: number;
  color?: string | null;
  description: string;
  freeLabel: string;
  locale: 'ar' | 'en';
  name: string;
  onClick: () => void;
  vatShort: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative min-w-0 rounded-lg border-2 p-4 text-start transition ${
        active ? 'border-green-600 bg-green-50' : 'border-gray-200 bg-white hover:border-green-300'
      }`}
    >
      {active ? (
        <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-white">
          <Check className="h-4 w-4" />
        </div>
      ) : null}
      <div className="mb-1 flex items-center gap-2">
        <h4 className="font-bold">{name}</h4>
        {badgeLabel ? (
          <span className="rounded-full px-2 py-0.5 text-xs font-bold text-white" style={{ backgroundColor: color || '#16a34a' }}>
            {badgeLabel}
          </span>
        ) : null}
      </div>
      <p className="mb-2 line-clamp-2 min-h-10 text-sm text-gray-600">{description}</p>
      <div className={`min-w-0 ${active ? 'text-green-600' : 'text-gray-900'}`}>
        <PlanPriceWithVat
          basePrice={basePrice}
          locale={locale}
          freeLabel={freeLabel}
          vatShort={vatShort}
          mainClassName={`${active ? 'text-2xl' : 'text-lg'} font-bold`}
        />
      </div>
    </button>
  );
}

function getPlanPrice(plan: PromotionPlan, days: number) {
  if (days === 7) return Number(plan.weekPrice);
  if (days === 14) return Number(plan.twoWeeksPrice);
  return Number(plan.monthPrice);
}

