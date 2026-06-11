import type { AssistantAuthContext } from './assistant-auth-actions';
import { formatAssistantReply } from './assistant-format';
import { executeGetPlatformInfo } from './assistant-platform';
import { executeFeaturedListings, executeSearchStores } from './assistant.tools';
import type { AssistantChatResult } from './assistant.types';
import type { AssistantLocale } from './assistant.validation';

export const QUICK_REPLY_INTENTS = [
  'pricing_overview',
  'search_car_showrooms',
  'featured_listings',
  'create_store',
  'promote_listing',
  'post_ad',
  'browse_stores',
  'contact'
] as const;

export type QuickReplyIntent = (typeof QUICK_REPLY_INTENTS)[number];

type StorePlanRow = {
  name: string;
  description: string;
  hasTrial: boolean;
  trialDays: number;
  trialMaxListings: number;
  linkedPromotion: { name: string; badgeLabel: string | null } | null;
  pricing: Array<{
    category: string;
    billingPeriod: string;
    maxListings: number;
    finalPrice: number;
  }>;
};

type PromotionPlanRow = {
  name: string;
  description: string;
  badgeLabel: string | null;
  weekPrice: number;
  twoWeeksPrice: number;
  monthPrice: number;
  appearsFirst: boolean;
  isFree: boolean;
};

function formatOmr(price: number, locale: AssistantLocale) {
  const label = locale === 'ar' ? 'ر.ع' : 'OMR';
  return `${price} ${label}`;
}

function buildPricingOverviewReply(
  locale: AssistantLocale,
  storePlans: StorePlanRow[],
  promotionPlans: PromotionPlanRow[],
  disclaimer: string
) {
  const lines: string[] = [disclaimer, ''];

  lines.push(locale === 'ar' ? '🏪 خطط المتاجر:' : '🏪 Store plans:');
  if (storePlans.length === 0) {
    lines.push(locale === 'ar' ? '🔹 لا توجد خطط متاحة حالياً.' : '🔹 No store plans available right now.');
  } else {
    for (const plan of storePlans) {
      lines.push(`🔹 ${plan.name}`);
      if (plan.description.trim()) lines.push(plan.description.trim());
      if (plan.hasTrial) {
        lines.push(
          locale === 'ar'
            ? `✅ تجربة مجانية ${plan.trialDays} يوم — حتى ${plan.trialMaxListings} إعلان`
            : `✅ Free trial ${plan.trialDays} days — up to ${plan.trialMaxListings} listings`
        );
      }
      if (plan.linkedPromotion) {
        lines.push(
          locale === 'ar'
            ? `⭐ تمييز تلقائي: ${plan.linkedPromotion.badgeLabel || plan.linkedPromotion.name}`
            : `⭐ Auto promotion: ${plan.linkedPromotion.badgeLabel || plan.linkedPromotion.name}`
        );
      }
      for (const row of plan.pricing.slice(0, 6)) {
        lines.push(
          locale === 'ar'
            ? `   ${row.category} · ${row.billingPeriod}: ${formatOmr(row.finalPrice, locale)} · ${row.maxListings} إعلان`
            : `   ${row.category} · ${row.billingPeriod}: ${formatOmr(row.finalPrice, locale)} · ${row.maxListings} listings`
        );
      }
      lines.push('');
    }
  }

  lines.push(locale === 'ar' ? '💰 تمييز العروض:' : '💰 Listing promotions:');
  const paidPlans = promotionPlans.filter((plan) => !plan.isFree);
  if (paidPlans.length === 0) {
    lines.push(locale === 'ar' ? '🔹 لا توجد خطط تمييز مدفوعة حالياً.' : '🔹 No paid promotion plans right now.');
  } else {
    for (const plan of paidPlans) {
      lines.push(`🔹 ${plan.badgeLabel || plan.name}`);
      if (plan.description.trim()) lines.push(plan.description.trim());
      lines.push(
        locale === 'ar'
          ? `   أسبوع: ${formatOmr(plan.weekPrice, locale)} · أسبوعان: ${formatOmr(plan.twoWeeksPrice, locale)} · شهر: ${formatOmr(plan.monthPrice, locale)}`
          : `   1 week: ${formatOmr(plan.weekPrice, locale)} · 2 weeks: ${formatOmr(plan.twoWeeksPrice, locale)} · 1 month: ${formatOmr(plan.monthPrice, locale)}`
      );
      if (plan.appearsFirst) {
        lines.push(locale === 'ar' ? '   ✅ أولوية ظهور أعلى' : '   ✅ Higher search priority');
      }
      lines.push('');
    }
  }

  return lines.join('\n').trim();
}

function buildStoreSearchReply(locale: AssistantLocale, count: number, isFallback: boolean) {
  if (count === 0) {
    return locale === 'ar'
      ? 'لم أجد متاجر مطابقة حالياً. جرّب توسيع البحث أو تصفح جميع المتاجر.'
      : 'No matching stores right now. Try a broader search or browse all stores.';
  }
  if (isFallback) {
    return locale === 'ar' ? '🔹 هذه أقرب المتاجر النشطة المتاحة:' : '🔹 Here are the closest active stores available:';
  }
  return locale === 'ar' ? `🔹 وجدت ${count} متجر/متاجر:` : `🔹 Found ${count} store(s):`;
}

function buildFeaturedReply(locale: AssistantLocale, count: number) {
  if (count === 0) {
    return locale === 'ar' ? 'لا توجد عروض مميزة حالياً.' : 'No featured listings right now.';
  }
  return locale === 'ar' ? '⭐ إليك بعض العروض المميزة:' : '⭐ Here are some featured listings:';
}

function buildHelpLead(locale: AssistantLocale, intent: 'create_store' | 'promote_listing' | 'post_ad' | 'contact') {
  const map = {
    create_store: locale === 'ar' ? '✅ إنشاء متجر' : '✅ Create a store',
    promote_listing: locale === 'ar' ? '✅ تمييز إعلان' : '✅ Promote a listing',
    post_ad: locale === 'ar' ? '✅ نشر إعلان' : '✅ Post a listing',
    contact: locale === 'ar' ? '✅ التواصل معنا' : '✅ Contact us'
  };
  return map[intent];
}

export async function executeQuickReply(
  intent: QuickReplyIntent,
  auth: AssistantAuthContext
): Promise<AssistantChatResult> {
  const locale = auth.locale;

  switch (intent) {
    case 'pricing_overview': {
      const info = await executeGetPlatformInfo({ topic: 'pricing_overview' }, auth);
      const storePlans = (info.data.storePlans ?? []) as StorePlanRow[];
      const promotionPlans = (info.data.promotionPlans ?? []) as PromotionPlanRow[];
      const disclaimer = String(info.data.storePricingDisclaimer ?? info.summary);
      return {
        reply: formatAssistantReply(buildPricingOverviewReply(locale, storePlans, promotionPlans, disclaimer)),
        listings: [],
        stores: [],
        articles: [],
        actions: info.actions
      };
    }

    case 'search_car_showrooms': {
      const userMessage = locale === 'ar' ? 'أريد معارض سيارات' : 'I want car showrooms';
      const result = await executeSearchStores({}, userMessage, locale);
      return {
        reply: formatAssistantReply(buildStoreSearchReply(locale, result.stores.length, result.isFallback)),
        listings: [],
        stores: result.stores,
        articles: [],
        actions: result.actions
      };
    }

    case 'browse_stores': {
      const userMessage = locale === 'ar' ? 'أريد استكشاف المتاجر' : 'I want to explore stores';
      const result = await executeSearchStores({}, userMessage, locale);
      return {
        reply: formatAssistantReply(buildStoreSearchReply(locale, result.stores.length, result.isFallback)),
        listings: [],
        stores: result.stores,
        articles: [],
        actions: result.actions
      };
    }

    case 'featured_listings': {
      const featured = await executeFeaturedListings(auth);
      const reply = buildFeaturedReply(locale, featured.listings.length);
      return {
        reply: formatAssistantReply(reply),
        listings: featured.listings,
        stores: [],
        articles: [],
        actions: featured.actions
      };
    }

    case 'create_store':
    case 'promote_listing':
    case 'post_ad':
    case 'contact': {
      const topic = intent;
      const info = await executeGetPlatformInfo({ topic }, auth);
      const reply = `${buildHelpLead(locale, intent)}\n\n${info.summary}`.trim();
      return {
        reply: formatAssistantReply(reply),
        listings: [],
        stores: [],
        articles: [],
        actions: info.actions
      };
    }

    default:
      return {
        reply: formatAssistantReply(locale === 'ar' ? 'كيف يمكنني مساعدتك؟' : 'How can I help you?'),
        listings: [],
        stores: [],
        articles: [],
        actions: []
      };
  }
}
