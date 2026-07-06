import { API_ENDPOINTS, http, type ApiEnvelope } from '../lib/api';

export type SearchSuggestionType = 'listing' | 'category' | 'article' | 'tourism' | 'store';

export type SearchSuggestion = {
  type: SearchSuggestionType;
  id: string;
  slug?: string;
  label: string;
};

export async function fetchSearchSuggestions(params: { q: string; locale: 'ar' | 'en'; limit?: number }) {
  const response = await http.get<ApiEnvelope<{ suggestions: SearchSuggestion[] }>>(API_ENDPOINTS.search.suggestions, {
    params: {
      q: params.q.trim(),
      locale: params.locale,
      limit: params.limit ?? 5
    }
  });
  const suggestions = response.data.data?.suggestions;
  return Array.isArray(suggestions) ? suggestions : [];
}
