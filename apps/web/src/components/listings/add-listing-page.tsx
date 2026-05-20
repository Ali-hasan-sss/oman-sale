'use client';

import { Check, Globe, Search, Upload, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChangeEvent, FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';

import { HeaderAuthAction } from '@/components/auth/user-menu';
import { ChatNavLink } from '@/components/chat/chat-nav-link';
import { SiteFooter } from '@/components/home/site-footer';
import { MobileNavMenu } from '@/components/navigation/mobile-nav-menu';
import { api } from '@/lib/api';
import { buildCategoryTree } from '@/lib/category-tree';
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

const omanCities = ['مسقط', 'صلالة', 'صحار', 'نزوى', 'صور', 'البريمي', 'الرستاق', 'السيب', 'الخوير', 'القرم'];

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
    success: 'تم نشر الإعلان بنجاح.'
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
    success: 'Listing published successfully.'
  }
};

const durationOptions = [
  { days: 7, labelKey: 'oneWeek' },
  { days: 14, labelKey: 'twoWeeks' },
  { days: 30, labelKey: 'oneMonth' }
] as const;

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);
  const selectedCategory = categories.find((category) => category.id === categoryId);
  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId);
  const authHeaders = useMemo(() => {
    const token = getUserAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : undefined;
  }, []);
  const inputClass = 'w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-green-500';

  useEffect(() => {
    hydrateFromStorage();
    const token = getUserAccessToken();
    if (!token) {
      router.replace(localizedPath('/login'));
      return;
    }

    Promise.all([
      api.get<{ data: Category[] }>(`/categories?locale=${locale}`),
      api.get<{ data: PromotionPlan[] }>('/promotions/plans')
    ])
      .then(([categoriesResponse, plansResponse]) => {
        const promotionPlans = plansResponse.data.data;
        setCategories(categoriesResponse.data.data);
        setPlans(promotionPlans);
        setSelectedPlanId((current) => current || promotionPlans[0]?.id || '');
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
    if (!selectedCategory) return;

    setError('');
    setMessage('');
    setIsSubmitting(true);

    try {
      const adResponse = await api.post<{ data: CreatedAd }>(
        '/ads',
        {
          title,
          description,
          type: selectedCategory.type,
          price: Number(price.replaceAll(',', '')),
          currency: 'OMR',
          city,
          categoryId,
          imageUrls
        },
        { headers: authHeaders }
      );

      if (selectedPlan) {
        await api.post(
          '/promotions/ad-promotions',
          { adId: adResponse.data.data.id, planId: selectedPlan.id, days: duration },
          { headers: authHeaders }
        );
      }

      setMessage(text.success);
      router.push(localizedPath('/my-listings'));
    } catch {
      setError(text.createError);
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
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">{text.title}</h1>
          <p className="text-gray-600">{text.subtitle}</p>
        </div>

        <form onSubmit={submit} className="rounded-2xl bg-white p-8 shadow-sm">
          {error ? <p className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</p> : null}
          {message ? <p className="mb-6 rounded-xl bg-green-50 px-4 py-3 text-sm font-bold text-green-700">{message}</p> : null}

          <Field label={text.adTitle}>
            <input value={title} onChange={(event) => setTitle(event.target.value)} type="text" required placeholder={text.titlePlaceholder} className={inputClass} />
          </Field>

          <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <Field label={text.category}>
              <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} required className={inputClass}>
                <option value="">{text.selectCategory}</option>
                {categoryTree.map((parent) => (
                  <optgroup key={parent.id} label={parent.name}>
                    <option value={parent.id}>{parent.name}</option>
                    {parent.children.map((child) => (
                      <option key={child.id} value={child.id}>
                        {locale === 'ar' ? `— ${child.name}` : `${child.name} —`}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </Field>
            <Field label={text.location}>
              <select value={city} onChange={(event) => setCity(event.target.value)} required className={inputClass}>
                <option value="">{text.selectCity}</option>
                {omanCities.map((cityOption) => (
                  <option key={cityOption} value={cityOption}>
                    {cityOption}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label={text.price}>
            <input value={price} onChange={(event) => setPrice(event.target.value)} type="text" required placeholder={text.pricePlaceholder} className={inputClass} inputMode="decimal" />
          </Field>

          <Field label={text.description}>
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} required rows={6} placeholder={text.descriptionPlaceholder} className={inputClass} />
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

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="mb-6">
      <label className="mb-2 block">{label}</label>
      {children}
    </div>
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
