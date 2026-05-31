'use client';

import { Check, Globe, Search, Upload, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChangeEvent, FormEvent, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { HeaderAuthAction } from '@/components/auth/user-menu';
import { ChatNavLink } from '@/components/chat/chat-nav-link';
import { SiteFooter } from '@/components/home/site-footer';
import { MobileNavMenu } from '@/components/navigation/mobile-nav-menu';
import { api } from '@/lib/api';
import { getValidationFieldErrors, resolveApiErrorMessage } from '@/lib/api-errors';
import { buildCategoryTree, flattenCategoryTreeWithPath } from '@/lib/category-tree';
import {
  omanCities,
  parseListingPrice,
  sanitizePriceInput,
  validateListingForm
} from '@/lib/listing-form-validation';
import { useI18n } from '@/lib/i18n';
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
    location: 'الموقع *',
    selectCity: 'اختر المدينة',
    price: 'السعر (ر.ع) *',
    pricePlaceholder: 'مثال: 12,500',
    description: 'الوصف *',
    descriptionPlaceholder: 'اكتب وصفاً تفصيلياً للإعلان...',
    images: 'الصور',
    uploadTitle: 'اضغط لرفع الصور أو اسحبها هنا',
    uploadHint: 'يمكنك رفع حتى 8 صور (JPG, PNG)',
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
    publishFromPersonalHint: 'يُعرض الإعلان باسمك ويتطلب الدفع للتمييز مثل أي مستخدم'
  },
  en: {
    title: 'Post Your Ad',
    subtitle: 'Fill in the following details to publish your listing',
    adTitle: 'Listing title *',
    titlePlaceholder: 'Example: Toyota Camry 2023 for sale',
    category: 'Category *',
    selectCategory: 'Select category',
    location: 'Location *',
    selectCity: 'Select city',
    price: 'Price (OMR) *',
    pricePlaceholder: 'Example: 12,500',
    description: 'Description *',
    descriptionPlaceholder: 'Write a detailed description for your listing...',
    images: 'Images',
    uploadTitle: 'Click to upload images or drag them here',
    uploadHint: 'You can upload up to 8 images (JPG, PNG)',
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
    publishFromPersonalHint: 'Listing appears under your name and paid promotion applies'
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
  const { dir, locale, localizedPath, m, toggleLocale } = useI18n();
  const text = labels[locale];
  const hydrateFromStorage = useAuthStore((state) => state.hydrateFromStorage);
  const [categories, setCategories] = useState<Category[]>([]);
  const [plans, setPlans] = useState<PromotionPlan[]>([]);
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [city, setCity] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [duration, setDuration] = useState(7);
  const [ownerStore, setOwnerStore] = useState<OwnerStore | null>(null);
  const [publishSource, setPublishSource] = useState<PublishSource>('personal');
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
  const authHeaders = useMemo(() => {
    const token = getUserAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : undefined;
  }, []);
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
      .catch(() => setError(text.loadError));
  }, [locale]);

  const uploadImages = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).slice(0, 8 - imageUrls.length);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const imageData = reader.result;
        if (typeof imageData === 'string') {
          setImageUrls((current) => [...current, imageData].slice(0, 8));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextFieldErrors = validateListingForm(
      { title, description, categoryId, city, price },
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
      const adResponse = await api.post<{ data: CreatedAd }>(
        '/ads',
        {
          title: title.trim(),
          description: description.trim(),
          type: selectedCategory.type,
          price: parseListingPrice(price),
          currency: 'OMR',
          city,
          categoryId,
          imageUrls,
          ...(isStorePublish && ownerStore ? { storeId: ownerStore.id } : {})
        },
        { headers: authHeaders }
      );

      if (selectedPlan && !isStorePublish) {
        await api.post(
          '/promotions/ad-promotions',
          { adId: adResponse.data.data.id, planId: selectedPlan.id, days: duration },
          { headers: authHeaders }
        );
      }

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
    <div className="min-h-screen bg-gray-50" dir={dir}>
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="mb-4 flex items-center justify-between gap-4">
            <Link className="flex items-center gap-3" href={localizedPath('/')}>
              <img src="/logo.png" alt="Oman Sale" className="h-14 w-auto" />
            </Link>
            <MobileNavMenu />
            <div className="hidden items-center gap-4 lg:flex">
              <button className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 transition hover:bg-gray-50" onClick={toggleLocale} type="button">
                <Globe size={18} />
                <span className="text-sm">{m.common.languageSwitch}</span>
              </button>
              <ChatNavLink className="rounded-lg border border-gray-300 px-4 py-2 transition hover:bg-gray-50" />
              <HeaderLink href="/all-listings" label={m.common.allListings} />
              <HeaderLink href="/my-listings" label={m.common.myListings} />
              <Link className="rounded-lg bg-green-600 px-4 py-2 text-white transition hover:bg-green-700" href={localizedPath('/add-listing')}>
                {m.common.addListing}
              </Link>
              <HeaderAuthAction loginClassName="rounded-lg border border-gray-300 px-4 py-2 transition hover:bg-gray-50" />
            </div>
          </div>
          <div className="relative">
            <Search className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${dir === 'rtl' ? 'right-3' : 'left-3'}`} size={20} />
            <input
              type="text"
              placeholder={m.home.searchPlaceholder}
              className={`w-full rounded-lg border border-gray-300 py-3 outline-none focus:ring-2 focus:ring-green-500 ${dir === 'rtl' ? 'pl-4 pr-12' : 'pl-12 pr-4'}`}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div ref={errorBannerRef} className="scroll-mt-56">
          {error ? (
            <p className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</p>
          ) : null}
          {message ? (
            <p className="mb-6 rounded-xl bg-green-50 px-4 py-3 text-sm font-bold text-green-700">{message}</p>
          ) : null}
        </div>

        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">{text.title}</h1>
          <p className="text-gray-600">{text.subtitle}</p>
        </div>

        <form onSubmit={submit} className="rounded-2xl bg-white p-8 shadow-sm">
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

          <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
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
            <Field error={fieldErrors.city} label={text.location}>
              <select
                value={city}
                onChange={(event) => {
                  setCity(event.target.value);
                  clearFieldError('city');
                }}
                className={fieldInputClass(fieldErrors.city)}
              >
                <option value="">{text.selectCity}</option>
                {omanCities.map((cityOption) => (
                  <option key={cityOption} value={cityOption}>
                    {cityOption}
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
            <label className="mb-2 block">{text.images}</label>
            <label className="block cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-8 text-center transition hover:border-green-500">
              <Upload className="mx-auto mb-4 text-gray-400" size={48} />
              <p className="mb-2 text-gray-600">{text.uploadTitle}</p>
              <p className="text-sm text-gray-500">{text.uploadHint}</p>
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={uploadImages} className="hidden" />
            </label>
            {imageUrls.length > 0 ? (
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                {imageUrls.map((imageUrl, index) => (
                  <div key={imageUrl.slice(0, 40) + index} className="relative h-28 overflow-hidden rounded-xl border border-gray-200">
                    <img src={imageUrl} alt={`${text.images} ${index + 1}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImageUrls((current) => current.filter((_, currentIndex) => currentIndex !== index))}
                      className="absolute right-2 top-2 rounded-full bg-white/90 p-1 text-red-600 shadow"
                      aria-label={text.removeImage}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {canPublishFromStore ? (
            <div className="mb-6 rounded-lg bg-gray-50 p-6">
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

          {!isStorePublish ? (
          <div className="mb-6 rounded-lg bg-gray-50 p-6">
            <h3 className="mb-2 text-xl font-bold">{text.adType}</h3>
            <p className="mb-4 text-gray-600">{text.adTypeSubtitle}</p>
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {plans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  active={selectedPlanId === plan.id}
                  description={locale === 'en' ? plan.descriptionEn : plan.descriptionAr}
                  name={locale === 'en' ? plan.nameEn : plan.nameAr}
                  badgeLabel={plan.badgeLabel}
                  color={plan.color}
                  price={formatPrice(getPlanPrice(plan, duration), locale, text.free)}
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
            <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-6">
              <h3 className="mb-2 text-xl font-bold">{text.publishFromStore}</h3>
              <p className="text-gray-700">{text.publishFromStoreHint}</p>
            </div>
          )}

          <div className="flex gap-4">
            <button type="submit" disabled={isSubmitting} className="flex-1 rounded-lg bg-green-600 px-6 py-3 font-bold text-white transition hover:bg-green-700 disabled:opacity-70">
              {isSubmitting ? text.publishing : text.publish}
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

  function HeaderLink({ href, label }: { href: string; label: string }) {
    return (
      <Link className="rounded-lg border border-gray-300 px-4 py-2 transition hover:bg-gray-50" href={localizedPath(href)}>
        {label}
      </Link>
    );
  }
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
  color,
  description,
  name,
  onClick,
  price
}: {
  active: boolean;
  badgeLabel?: string | null;
  color?: string | null;
  description: string;
  name: string;
  onClick: () => void;
  price: string;
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
      <div className="mb-1 flex items-center gap-2">
        <h4 className="font-bold">{name}</h4>
        {badgeLabel ? (
          <span className="rounded-full px-2 py-0.5 text-xs font-bold text-white" style={{ backgroundColor: color || '#16a34a' }}>
            {badgeLabel}
          </span>
        ) : null}
      </div>
      <p className="mb-2 line-clamp-2 min-h-10 text-sm text-gray-600">{description}</p>
      <p className={`${active ? 'text-2xl text-green-600' : 'text-lg text-gray-900'} font-bold`}>{price}</p>
    </button>
  );
}

function getPlanPrice(plan: PromotionPlan, days: number) {
  if (days === 7) return Number(plan.weekPrice);
  if (days === 14) return Number(plan.twoWeeksPrice);
  return Number(plan.monthPrice);
}

function formatPrice(price: number, locale: 'ar' | 'en', freeLabel: string) {
  return price === 0 ? freeLabel : locale === 'en' ? `OMR ${price.toLocaleString()}` : `${price.toLocaleString()} ر.ع`;
}
