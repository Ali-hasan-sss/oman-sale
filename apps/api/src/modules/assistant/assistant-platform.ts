import { promotionsRepository } from '../promotions/promotions.repository';
import { computeStorePlanFinalPrice } from '../store-plans/store-plan-pricing.utils';
import { storePlansRepository } from '../store-plans/store-plans.repository';
import type { AssistantAuthContext } from './assistant-auth-actions';
import {
  buildBannerAdActions,
  buildChatActions,
  buildContactActions,
  buildCreateStoreActions,
  buildFavoritesActions,
  buildPlatformOverviewActions,
  buildPostAdActions,
  buildPricingActions,
  buildPromoteListingActions
} from './assistant-auth-actions';
import type { AssistantAction } from './assistant.types';
import type { GetPlatformInfoToolArgs } from './assistant.types';

const PLATFORM_COPY = {
  ar: {
    overview:
      'Oman Sale منصة عمانية للبيع والشراء: إعلانات فردية، متاجر بخطط اشتراك، تمييز العروض، دردشة بين المستخدمين، المفضلة، وطلبات بنرات إعلانية. الدفع عبر ثواني (Thawani).',
    features: [
      { title: 'إعلانات متنوعة', detail: 'سيارات، عقارات، إلكترونيات، وظائف، خدمات، وأكثر.' },
      { title: 'متاجر احترافية', detail: 'أنشئ متجراً بخطط شهرية/سنوية مع فترة تجريبية وتمييز تلقائي للإعلانات حسب الخطة.' },
      { title: 'تمييز العروض', detail: 'خطط ترويج متعددة (مميز، مميز جداً، كامل التميز) بأسعار أسبوعية وشهرية.' },
      { title: 'دردشة مباشرة', detail: 'تواصل مع البائعين والمشترين داخل المنصة.' },
      { title: 'المفضلة', detail: 'احفظ الإعلانات التي تهمك للرجوع إليها لاحقاً.' },
      { title: 'بنرات إعلانية', detail: 'اطلب بنراً يظهر في الصفحة الرئيسية.' },
      { title: 'دعم وتغطية', detail: 'تغطية محافظات عمان مع فريق دعم عبر البريد والهاتف.' }
    ],
    createStore:
      'لإنشاء متجر: سجّل الدخول، افتح «إنشاء متجر»، اختر الفئة الرئيسية ونوع المتجر، ثم اختر خطة الاشتراك (شهري/سنوي). يمكنك البدء بفترة تجريبية إن كانت متاحة، أو الدفع عبر ثواني.',
    promoteListing:
      'لتمييز إعلان: افتح «إعلاناتي»، اختر الإعلان، اضغط «ترقية»، ثم اختر خطة التمييز والمدة (أسبوع، أسبوعين، شهر). الإعلانات المميزة تظهر أولاً في البحث.',
    postAd:
      'لنشر إعلان: سجّل الدخول، اضغط «أضف إعلان»، اختر الفئة، أضف العنوان والوصف والصور والسعر، ثم انشر. يمكنك تمييزه لاحقاً من «إعلاناتي».',
    chat:
      'الدردشة متاحة للمستخدمين المسجلين. افتح صفحة الإعلان واضغط للتواصل، أو ادخل «دردشاتي» لمتابعة محادثاتك.',
    favorites: 'المفضلة متاحة بعد تسجيل الدخول. احفظ أي إعلان بالضغط على أيقونة المفضلة.',
    bannerAds:
      'لطلب بنر إعلاني في الصفحة الرئيسية: سجّل الدخول وافتح «طلب بنر إعلاني»، أرفق التفاصيل وادفع عبر ثواني.',
    payments: 'المدفوعات على Oman Sale تتم عبر بوابة ثواني (Thawani) — اشتراكات المتاجر، تمييز الإعلانات، والبنرات.',
    contact: 'تواصل معنا: info@omansale.om | هاتف: +968 2456 7890 | مسقط، سلطنة عمان.',
    storePlansNote:
      '📌 ملاحظة: أسعار خطط المتاجر تختلف حسب نوع المتجر والفئة — مثل معارض السيارات، السوبرماركت، المكاتب العقارية، الإلكترونيات، الملابس، وغيرها. الأسعار أدناه لكل فئة على حدة (شهري/سنوي) وقد تشمل خصومات أو فترة تجريبية.',
    promotionNote: 'أسعار التمييز بالريال العماني (OMR). الإعلان العادي مجاني بدون تكلفة تمييز.'
  },
  en: {
    overview:
      'Oman Sale is an Omani marketplace for buying and selling: individual listings, subscription stores, listing promotions, in-app chat, favorites, and homepage banner ads. Payments via Thawani.',
    features: [
      { title: 'Wide categories', detail: 'Cars, real estate, electronics, jobs, services, and more.' },
      { title: 'Professional stores', detail: 'Create a store with monthly/yearly plans, optional trial, and auto-promotion on listings per plan.' },
      { title: 'Listing promotions', detail: 'Multiple promotion tiers (Featured, Super Featured, Fully Featured) with weekly and monthly pricing.' },
      { title: 'Direct chat', detail: 'Message buyers and sellers inside the platform.' },
      { title: 'Favorites', detail: 'Save listings you like for later.' },
      { title: 'Banner ads', detail: 'Request a wide banner on the homepage.' },
      { title: 'Support & coverage', detail: 'Coverage across Oman with email and phone support.' }
    ],
    createStore:
      'To create a store: sign in, open Create Store, pick your root category and store type, then choose a subscription plan (monthly/yearly). Start with a trial if available, or pay via Thawani.',
    promoteListing:
      'To promote a listing: open My Listings, pick an ad, tap Promote, choose a plan and duration (1 week, 2 weeks, 1 month). Promoted listings rank higher in search.',
    postAd:
      'To post a listing: sign in, tap Add Listing, choose a category, add title, description, photos, and price, then publish. Promote it later from My Listings.',
    chat: 'Chat is available for signed-in users. Open a listing to contact the seller, or go to My Chats.',
    favorites: 'Favorites require sign-in. Save any listing with the favorite button.',
    bannerAds: 'To request a homepage banner: sign in, open Request Banner Ad, submit details, and pay via Thawani.',
    payments: 'Payments on Oman Sale use Thawani — store subscriptions, listing promotions, and banner ads.',
    contact: 'Contact us: info@omansale.om | Phone: +968 2456 7890 | Muscat, Sultanate of Oman.',
    storePlansNote:
      '📌 Note: Store plan prices vary by store type and category — e.g. car showrooms, supermarkets, real estate offices, electronics, clothing, and more. Prices below are per category (monthly/yearly) and may include discounts or a free trial.',
    promotionNote: 'Promotion prices are in OMR. The normal (free) tier has no promotion fee.'
  }
} as const;

function formatPrice(value: unknown) {
  const num = Number(value);
  return Number.isFinite(num) ? Math.round(num * 1000) / 1000 : 0;
}

function billingLabel(period: string, locale: 'ar' | 'en') {
  if (period === 'THREE_MONTHS') return locale === 'ar' ? '3 أشهر' : '3 months';
  if (period === 'TWO_MONTHS') return locale === 'ar' ? 'شهرين' : '2 months';
  return locale === 'ar' ? 'شهر واحد' : '1 month';
}

async function fetchPromotionPlans(locale: 'ar' | 'en', planFilter?: string) {
  const plans = await promotionsRepository.listPlans(false);
  const filter = planFilter?.trim().toLowerCase();

  return plans
    .filter((plan) => {
      if (!filter) return true;
      const haystack = [plan.name, plan.nameAr, plan.nameEn, plan.badgeLabel ?? ''].join(' ').toLowerCase();
      return haystack.includes(filter);
    })
    .map((plan) => ({
      id: plan.id,
      name: locale === 'ar' ? plan.nameAr : plan.nameEn,
      description: locale === 'ar' ? plan.descriptionAr : plan.descriptionEn,
      badgeLabel: plan.badgeLabel,
      weekPrice: formatPrice(plan.weekPrice),
      twoWeeksPrice: formatPrice(plan.twoWeeksPrice),
      monthPrice: formatPrice(plan.monthPrice),
      dailyImpressions: plan.dailyImpressions,
      appearsFirst: plan.appearsFirst,
      priorityScore: plan.priorityScore,
      isFree: formatPrice(plan.weekPrice) === 0 && formatPrice(plan.monthPrice) === 0
    }));
}

async function fetchStorePlans(locale: 'ar' | 'en', planFilter?: string) {
  const plans = await storePlansRepository.listPlans({ includeInactive: false });
  const filter = planFilter?.trim().toLowerCase();

  return plans
    .filter((plan) => {
      if (!filter) return true;
      const haystack = [plan.nameAr, plan.nameEn].join(' ').toLowerCase();
      return haystack.includes(filter);
    })
    .map((plan) => {
      const planDiscount = {
        discountType: plan.discountType,
        discountValue: plan.discountValue,
        isDiscountActive: plan.isDiscountActive
      };

      const pricing = plan.pricing.map((row) => {
        const computed = computeStorePlanFinalPrice(row, planDiscount);
        return {
          category: locale === 'ar' ? row.category.nameAr : row.category.nameEn,
          categorySlug: row.category.slug,
          billingPeriod: billingLabel(row.billingPeriod, locale),
          maxListings: row.maxListings,
          basePrice: formatPrice(computed.basePrice),
          finalPrice: formatPrice(computed.finalPrice),
          discountAmount: formatPrice(computed.discountAmount)
        };
      });

      return {
        id: plan.id,
        name: locale === 'ar' ? plan.nameAr : plan.nameEn,
        description: locale === 'ar' ? plan.descriptionAr : plan.descriptionEn,
        trialDays: plan.trialDays,
        trialMaxListings: plan.trialMaxListings,
        hasTrial: plan.trialDays > 0,
        linkedPromotion: plan.promotionPlan
          ? {
              name: locale === 'ar' ? plan.promotionPlan.nameAr : plan.promotionPlan.nameEn,
              badgeLabel: plan.promotionPlan.badgeLabel
            }
          : null,
        pricing
      };
    });
}

export type PlatformInfoResult = {
  summary: string;
  data: Record<string, unknown>;
  actions: AssistantAction[];
};

export async function executeGetPlatformInfo(
  args: GetPlatformInfoToolArgs,
  auth: AssistantAuthContext
): Promise<PlatformInfoResult> {
  const locale = auth.locale;
  const copy = PLATFORM_COPY[locale];
  const topic = args.topic;
  const planFilter = args.planName;

  switch (topic) {
    case 'pricing_overview': {
      const [storePlans, promotionPlans] = await Promise.all([
        fetchStorePlans(locale, planFilter),
        fetchPromotionPlans(locale, planFilter)
      ]);
      return {
        summary: `${copy.storePlansNote} ${copy.promotionNote}`,
        data: { storePlans, promotionPlans, storePricingDisclaimer: copy.storePlansNote },
        actions: buildPricingActions(auth)
      };
    }

    case 'store_plans': {
      const storePlans = await fetchStorePlans(locale, planFilter);
      return {
        summary: copy.storePlansNote,
        data: { storePlans, storePricingDisclaimer: copy.storePlansNote },
        actions: buildCreateStoreActions(auth)
      };
    }

    case 'promotion_plans': {
      const promotionPlans = await fetchPromotionPlans(locale, planFilter);
      return {
        summary: copy.promotionNote,
        data: { promotionPlans },
        actions: buildPromoteListingActions(auth)
      };
    }

    case 'platform_overview':
      return {
        summary: copy.overview,
        data: { features: copy.features },
        actions: buildPlatformOverviewActions(auth)
      };

    case 'contact':
      return {
        summary: copy.contact,
        data: { email: 'info@omansale.om', phone: '+96824567890', city: locale === 'ar' ? 'مسقط' : 'Muscat' },
        actions: buildContactActions(auth)
      };

    case 'create_store':
      return {
        summary: copy.createStore,
        data: { requiresAuth: true },
        actions: buildCreateStoreActions(auth)
      };

    case 'promote_listing':
      return {
        summary: copy.promoteListing,
        data: { requiresAuth: true },
        actions: buildPromoteListingActions(auth)
      };

    case 'post_ad':
      return {
        summary: copy.postAd,
        data: { requiresAuth: true },
        actions: buildPostAdActions(auth)
      };

    case 'chat_messaging':
      return {
        summary: copy.chat,
        data: { requiresAuth: true },
        actions: buildChatActions(auth)
      };

    case 'favorites':
      return {
        summary: copy.favorites,
        data: { requiresAuth: true },
        actions: buildFavoritesActions(auth)
      };

    case 'banner_ads':
      return {
        summary: copy.bannerAds,
        data: { requiresAuth: true },
        actions: buildBannerAdActions(auth)
      };

    case 'payments':
      return {
        summary: copy.payments,
        data: { provider: 'Thawani' },
        actions: buildContactActions(auth)
      };

    default:
      return {
        summary: copy.overview,
        data: { features: copy.features },
        actions: buildPlatformOverviewActions(auth)
      };
  }
}
