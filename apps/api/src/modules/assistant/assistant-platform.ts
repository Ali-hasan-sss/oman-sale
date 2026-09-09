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
      'Oman Sale منصة عمانية للبيع والشراء على الموقع وتطبيق الجوال: إعلانات فردية، متاجر بخطط اشتراك، تمييز العروض، دردشة، مفضلة، أخبار، وبنرات في الصفحة الرئيسية. الواجهة العربية من اليمين لليسار، والإنجليزية من اليسار لليمين. الدفع عبر ثواني (Thawani).',
    features: [
      { title: 'إعلانات متنوعة', detail: 'سيارات، عقارات، إلكترونيات، وظائف، خدمات، وأكثر — مع فئات فرعية وفلاتر حسب التصنيف.' },
      { title: 'متاجر احترافية', detail: 'أنشئ متجراً واحداً لكل حساب: تصنيف، نوع نشاط، خطة شهرية أو سنوية، تجربة مجانية إن وُجدت، وتمييز تلقائي حسب الخطة.' },
      { title: 'تمييز العروض', detail: 'خطط ترويج (مميز، مميز جداً، كامل التميز) أسبوع/أسبوعين/شهر. يمكن الترقية أثناء النشر أو لاحقاً من بطاقة الإعلان في «إعلاناتي».' },
      { title: 'دردشة مباشرة', detail: 'تواصل مع البائع من صفحة الإعلان، أو تابع المحادثات من تبويب «دردشاتي».' },
      { title: 'المفضلة', detail: 'احفظ الإعلانات بأيقونة القلب، ثم راجعها من القائمة أو الملف الشخصي.' },
      { title: 'الأخبار', detail: 'مقالات وأخبار داخل التطبيق (القائمة الجانبية → الأخبار) وعلى الموقع.' },
      { title: 'بنرات إعلانية', detail: 'بنرات الصفحة الرئيسية تُطلب من الموقع عبر «طلب بنر إعلاني».' },
      { title: 'دعم وتغطية', detail: 'تغطية محافظات وولايات عمان مع دعم عبر البريد والهاتف.' }
    ],
    createStore:
      'لإنشاء متجر على Oman Sale (الموقع والتطبيق):\n1) سجّل الدخول\n2) افتح «إنشاء متجر» من القائمة الجانبية أو الملف الشخصي — أو من «متجري» إن لم يكن لديك متجر. لا يوجد بنر إنشاء متجر في الصفحة الرئيسية.\n3) أدخل اسم المتجر بالعربية والإنجليزية، الهاتف، والرقم المدني\n4) اختر نوع النشاط: منزلي أو تجاري (السجل التجاري مطلوب للتجاري)\n5) اختر المحافظة والولاية، ثم الفئة الرئيسية ونوع المتجر (مثل معرض سيارات أو مكتب عقاري)\n6) اختر خطة الاشتراك (شهري أو سنوي)\n7) ابدأ بالفترة التجريبية إن وُجدت، أو ادفع عبر ثواني.\n\n📌 حساب واحد = متجر واحد. الأسعار تختلف حسب الفئة ونوع المتجر.',
    promoteListing:
      'لتمييز إعلان: افتح تبويب «إعلاناتي». كل إعلان داخل بطاقة فيها أزرار مباشرة: عرض، تعديل، ترويج، تعيين كمباع، وحذف. اضغط «ترويج» على البطاقة، ثم اختر الخطة والمدة (أسبوع، أسبوعين، شهر). يمكنك أيضاً اختيار التمييز أثناء نشر الإعلان. الإعلانات المميزة تظهر أولاً في البحث.',
    postAd:
      'لنشر إعلان: سجّل الدخول ثم اضغط «أضف إعلان» (في التطبيق من التبويب/الإضافة، وعلى الموقع من أضف إعلان).\n1) اختر الفئة ثم التصنيف الفرعي والفلاتر المطلوبة\n2) أضف العنوان والوصف والصور (وفيديو اختياري) والسعر\n3) حدّد المحافظة والولاية\n4) انشر كإعلان شخصي أو من متجرك إن وُجد\n5) يمكنك تمييزه عند النشر أو لاحقاً من بطاقة الإعلان في «إعلاناتي».',
    chat:
      'الدردشة للمستخدمين المسجّلين. افتح الإعلان واضغط للتواصل مع البائع، أو ادخل تبويب «دردشاتي» لمتابعة المحادثات.',
    favorites: 'المفضلة بعد تسجيل الدخول: اضغط أيقونة القلب على الإعلان، ثم راجعها من القائمة أو الملف الشخصي.',
    bannerAds:
      'لطلب بنر في الصفحة الرئيسية: من الموقع سجّل الدخول وافتح «طلب بنر إعلاني»، أرفق التفاصيل وادفع عبر ثواني. التطبيق يعرض البنرات في الرئيسية، وطلب البنر يتم عبر الموقع.',
    payments: 'المدفوعات عبر بوابة ثواني (Thawani): اشتراكات المتاجر، تمييز الإعلانات، وبنرات الموقع.',
    contact: 'تواصل معنا: info@omansale.om | هاتف: +968 2456 7890 | مسقط، سلطنة عمان.',
    storePlansNote:
      '📌 ملاحظة: خطط المتاجر متاحة باشتراك شهري أو سنوي. الأسعار تختلف حسب نوع المتجر والفئة — مثل معارض السيارات، المكاتب العقارية، السوبرماركت، الإلكترونيات، والملابس. الأسعار أدناه لكل فئة على حدة وقد تشمل خصومات أو فترة تجريبية.',
    promotionNote: 'أسعار التمييز بالريال العماني (OMR). الإعلان العادي مجاني بدون تكلفة تمييز.'
  },
  en: {
    overview:
      'Oman Sale is an Omani marketplace on the website and the mobile app: individual listings, subscription stores, listing promotions, chat, favorites, news, and homepage banners. Arabic UI is RTL; English is LTR. Payments via Thawani.',
    features: [
      { title: 'Wide categories', detail: 'Cars, real estate, electronics, jobs, services, and more — with subcategories and category filters.' },
      { title: 'Professional stores', detail: 'One store per account: classification, activity type, monthly/yearly plan, optional trial, and auto-promotion per plan.' },
      { title: 'Listing promotions', detail: 'Featured tiers with 1 week / 2 weeks / 1 month pricing. Promote while posting or later from the listing card in My Listings.' },
      { title: 'Direct chat', detail: 'Message the seller from a listing, or open the My Chats tab.' },
      { title: 'Favorites', detail: 'Save listings with the heart icon, then open Favorites from the menu or profile.' },
      { title: 'News', detail: 'Articles in the app (side menu → News) and on the website.' },
      { title: 'Banner ads', detail: 'Homepage banners are requested on the website via Request Banner Ad.' },
      { title: 'Support & coverage', detail: 'Coverage across Oman governorates and wilayats, with email and phone support.' }
    ],
    createStore:
      'To create a store on Oman Sale (website and app):\n1) Sign in\n2) Open Create Store from the side menu or Profile — or from My Store if you do not have one yet. There is no create-store banner on Home.\n3) Enter Arabic and English store names, phone, and national ID\n4) Choose activity type: home or commercial (commercial registration is required for commercial)\n5) Pick governorate and wilayah, then the root category and store type (e.g. car showroom or real estate office)\n6) Select a subscription plan (monthly or yearly)\n7) Start a free trial if available, or pay via Thawani.\n\n📌 One account = one store. Prices vary by category and store type.',
    promoteListing:
      'To promote a listing: open the My Listings tab. Each listing is a card with inline actions: View, Edit, Promote, Mark sold, and Delete. Tap Promote on the card, then choose a plan and duration (1 week, 2 weeks, 1 month). You can also add a promotion while posting. Promoted listings rank higher in search.',
    postAd:
      'To post a listing: sign in, then tap Post Ad / Add Listing.\n1) Choose the category, subcategory, and required filters\n2) Add title, description, photos (optional video), and price\n3) Set governorate and wilayah\n4) Publish as a personal listing or from your store if you have one\n5) Promote at publish time or later from the listing card in My Listings.',
    chat: 'Chat is for signed-in users. Open a listing to contact the seller, or go to the My Chats tab.',
    favorites: 'Favorites require sign-in. Save a listing with the heart icon, then open Favorites from the menu or profile.',
    bannerAds:
      'To request a homepage banner: on the website, sign in, open Request Banner Ad, submit details, and pay via Thawani. The app can show homepage banners; the request form is on the website.',
    payments: 'Payments on Oman Sale use Thawani — store subscriptions, listing promotions, and website banner ads.',
    contact: 'Contact us: info@omansale.om | Phone: +968 2456 7890 | Muscat, Sultanate of Oman.',
    storePlansNote:
      '📌 Note: Store plans are available on monthly or yearly billing. Prices vary by store type and category — e.g. car showrooms, real estate offices, supermarkets, electronics, and clothing. Prices below are per category and may include discounts or a free trial.',
    promotionNote: 'Promotion prices are in OMR. The normal (free) tier has no promotion fee.'
  }
} as const;

function formatPrice(value: unknown) {
  const num = Number(value);
  return Number.isFinite(num) ? Math.round(num * 1000) / 1000 : 0;
}

function billingLabel(period: string, locale: 'ar' | 'en') {
  if (period === 'THREE_MONTHS') return locale === 'ar' ? 'سنوي' : 'Yearly';
  if (period === 'TWO_MONTHS') return locale === 'ar' ? 'شهرين' : '2 months';
  return locale === 'ar' ? 'شهري' : 'Monthly';
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
