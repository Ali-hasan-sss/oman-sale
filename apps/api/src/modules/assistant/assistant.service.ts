import OpenAI from 'openai';

import { env } from '../../config/env';
import { ApiError } from '../../shared/utils/api-error';
import type { AssistantChatDto } from './assistant.validation';
import type {
  AssistantChatResult,
  GetPlatformInfoToolArgs,
  SearchListingsToolArgs,
  SearchStoresToolArgs
} from './assistant.types';
import { executeFeaturedListings, executeSearchListings, executeSearchStores } from './assistant.tools';
import { executeGetPlatformInfo } from './assistant-platform';
import { formatAssistantReply } from './assistant-format';
import { trimAssistantContext } from './assistant-limits';

const openai = env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: env.OPENAI_API_KEY })
  : null;

const PLATFORM_INFO_TOPICS = [
  'pricing_overview',
  'store_plans',
  'promotion_plans',
  'platform_overview',
  'contact',
  'create_store',
  'promote_listing',
  'post_ad',
  'chat_messaging',
  'favorites',
  'banner_ads',
  'payments',
  'featured_listings'
] as const;

const TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'search_listings',
      description:
        'Search marketplace listings/ads on Oman Sale. Use for ANY product/offer search. Pass 1-3 short keywords in q only. Do NOT pass minPrice/maxPrice unless the user explicitly stated a price range.',
      parameters: {
        type: 'object',
        properties: {
          q: { type: 'string', description: 'Search keywords in Arabic or English' },
          minPrice: { type: 'number', description: 'Minimum price in OMR' },
          maxPrice: { type: 'number', description: 'Maximum price in OMR' },
          city: { type: 'string', description: 'Oman city in Arabic enum form if known (e.g. مسقط)' },
          limit: { type: 'number', description: 'Max results — always capped at 4' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'search_stores',
      description:
        'Search active stores/shops on Oman Sale. Use when the user asks to find stores, showrooms, workshops, supermarkets, or any shop type.',
      parameters: {
        type: 'object',
        properties: {
          q: { type: 'string', description: 'Search keywords in Arabic or English' },
          city: { type: 'string', description: 'Oman city/governorate in Arabic enum form (e.g. مسقط)' },
          storeTypeSlug: { type: 'string', description: 'Optional store type slug if known' },
          limit: { type: 'number', description: 'Max results — always capped at 4' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_platform_info',
      description:
        'Get Oman Sale platform information: store subscription plans & prices, listing promotion plans & prices, platform features, how-to guides, contact, chat, favorites, banner ads, payments. ALWAYS use this (not search tools) when the user asks about plans, pricing, features, who you are, contact, or how something works on the platform.',
      parameters: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            enum: [...PLATFORM_INFO_TOPICS],
            description:
              'pricing_overview = both store & promotion prices; store_plans; promotion_plans; platform_overview = who we are & features; contact; create_store; promote_listing; post_ad; chat_messaging; favorites; banner_ads; payments; featured_listings'
          },
          planName: {
            type: 'string',
            description: 'Optional plan name filter when user asks about a specific plan (Arabic or English)'
          }
        },
        required: ['topic']
      }
    }
  }
];

function buildSystemPrompt(locale: 'ar' | 'en', isAuthenticated: boolean) {
  const language = locale === 'ar' ? 'Arabic' : 'English';
  const authNote = isAuthenticated
    ? 'The user IS signed in — suggest direct actions (create store, my listings, add listing).'
    : 'The user is NOT signed in — when they need an account, mention login/register; action buttons will be shown automatically.';

  return `You are the Oman Sale marketplace assistant — a helpful guide for buying, selling, stores, listings, plans, and platform features in Oman.
Always reply in ${language} matching the user's locale (${locale}).
Currency is OMR (Omani Rial). Users may say "ريال" or "OMR".
${authNote}

SEARCH:
- Product/offer searches → search_listings (short keywords in q, not full sentences).
- Store/showroom/workshop/supermarket searches → search_stores.
- Browse stores generally → search_stores with minimal q.
- Only pass city to search_stores or search_listings when the user explicitly mentions a city/governorate in their message — never default to Muscat or any city.

PLATFORM INFO (plans, pricing, features, contact, how-to):
- ALWAYS call get_platform_info for: store plans/prices, promotion/featured listing prices, "who are you", platform features, contact, how to create store, promote listing, post ad, chat, favorites, banner ads, payments.
- If user asks about BOTH store plans AND promotion prices → topic pricing_overview.
- If user asks about a specific plan by name → pass planName.
- Explain plan features and prices from tool data only — never invent prices.
- For plan/pricing answers: summarize clearly with names, prices (OMR), durations, and key benefits (max listings, trial, impressions, badge, priority).
- When explaining STORE plan prices, ALWAYS include the storePricingDisclaimer note: prices vary by store type/category (car showroom, grocery, real estate, etc.).
- Action buttons are added automatically — do not tell the user links are missing.

OTHER:
- ONLY pass minPrice/maxPrice when the user explicitly mentions a price range.
- If search returns isFallback=true, say these are the closest available results.
- If search returns count>0, introduce results — do NOT say nothing was found.
- Keep replies helpful: 2-5 sentences for plans/features, 1-3 for simple searches.
- Do not invent listing or store data — only describe tool results.

FORMATTING (strict — chat bubble, not a document):
- Plain text only. NEVER use Markdown: no ** or *, no # or ##, no backticks, no underscore emphasis.
- Do NOT use - or * for bullet lists. Use line breaks and a suitable emoji per point instead (e.g. ✅ 🏪 💰 📦 📞 🔹).
- Use emojis sparingly for warmth and structure — never replace words with emoji-only replies.
- Separate ideas with line breaks, not symbols.`;
}

export class AssistantService {
  async chat(dto: AssistantChatDto): Promise<AssistantChatResult> {
    if (!openai) {
      throw new ApiError(503, 'Assistant is not configured');
    }

    const locale = dto.locale;
    const auth = { locale, isAuthenticated: dto.isAuthenticated ?? false };
    const listings: AssistantChatResult['listings'] = [];
    const stores: AssistantChatResult['stores'] = [];
    const actions: AssistantChatResult['actions'] = [];
    const lastUserMessage = [...dto.messages].reverse().find((message) => message.role === 'user')?.content ?? '';

    const conversation: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: buildSystemPrompt(locale, auth.isAuthenticated) },
      ...trimAssistantContext(dto.messages).map((message) => ({
        role: message.role,
        content: message.content
      }))
    ];

    let response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: conversation,
      tools: TOOLS,
      tool_choice: 'auto',
      temperature: 0.4,
      max_tokens: 900
    });

    let choice = response.choices[0];

    for (let round = 0; round < 4 && choice?.message?.tool_calls?.length; round += 1) {
      const toolMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        choice.message,
        ...(await Promise.all(
          choice.message.tool_calls.map(async (toolCall) => {
            const name = toolCall.function.name;
            const args = JSON.parse(toolCall.function.arguments || '{}') as SearchListingsToolArgs &
              SearchStoresToolArgs &
              GetPlatformInfoToolArgs;

            if (name === 'search_listings') {
              const { listings: found, isFallback, actions: searchActions } = await executeSearchListings(
                args,
                lastUserMessage,
                locale
              );
              listings.splice(0, listings.length, ...found);
              stores.splice(0, stores.length);
              actions.splice(0, actions.length, ...searchActions);
              return {
                role: 'tool' as const,
                tool_call_id: toolCall.id,
                content: JSON.stringify({
                  count: found.length,
                  isFallback,
                  items: found.map((item) => ({
                    id: item.id,
                    title: item.title,
                    price: item.price,
                    currency: item.currency,
                    city: item.city,
                    isFeatured: item.isFeatured
                  }))
                })
              };
            }

            if (name === 'search_stores') {
              const { stores: found, isFallback, actions: searchActions } = await executeSearchStores(
                args,
                lastUserMessage,
                locale
              );
              stores.splice(0, stores.length, ...found);
              listings.splice(0, listings.length);
              actions.splice(0, actions.length, ...searchActions);
              return {
                role: 'tool' as const,
                tool_call_id: toolCall.id,
                content: JSON.stringify({
                  count: found.length,
                  isFallback,
                  items: found.map((item) => ({
                    id: item.id,
                    name: item.name,
                    city: item.city,
                    storeTypeName: item.storeTypeName,
                    listingsCount: item.listingsCount
                  }))
                })
              };
            }

            if (name === 'get_platform_info') {
              const topic = args.topic ?? 'platform_overview';

              if (topic === 'featured_listings') {
                const featured = await executeFeaturedListings(auth);
                listings.splice(0, listings.length, ...featured.listings);
                stores.splice(0, stores.length);
                actions.splice(0, actions.length, ...featured.actions);
                return {
                  role: 'tool' as const,
                  tool_call_id: toolCall.id,
                  content: JSON.stringify({
                    summary: featured.summary,
                    count: featured.listings.length
                  })
                };
              }

              const info = await executeGetPlatformInfo(args, auth);
              listings.splice(0, listings.length);
              stores.splice(0, stores.length);
              actions.splice(0, actions.length, ...info.actions);
              return {
                role: 'tool' as const,
                tool_call_id: toolCall.id,
                content: JSON.stringify({
                  summary: info.summary,
                  ...info.data
                })
              };
            }

            return {
              role: 'tool' as const,
              tool_call_id: toolCall.id,
              content: JSON.stringify({ error: 'Unknown tool' })
            };
          })
        ))
      ];

      conversation.push(...toolMessages);

      response = await openai.chat.completions.create({
        model: env.OPENAI_MODEL,
        messages: conversation,
        tools: TOOLS,
        tool_choice: 'auto',
        temperature: 0.4,
        max_tokens: 900
      });

      choice = response.choices[0];
    }

    const reply = choice?.message?.content?.trim();
    if (!reply) {
      throw new ApiError(502, 'Assistant returned an empty response');
    }

    return { reply: formatAssistantReply(reply), listings, stores, actions };
  }
}

export const assistantService = new AssistantService();
