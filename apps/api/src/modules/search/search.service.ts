import { searchRepository } from './search.repository';
import type { SearchQuery, SearchSuggestionsQuery } from './search.validation';

export interface SearchProvider {
  searchAds(query: SearchQuery): Promise<unknown>;
  getSuggestions(query: SearchSuggestionsQuery): Promise<unknown>;
}

export class PostgresSearchProvider implements SearchProvider {
  searchAds(query: SearchQuery) {
    return searchRepository.searchAds(query);
  }

  getSuggestions(query: SearchSuggestionsQuery) {
    return searchRepository.getSuggestions(query);
  }
}

export const searchService: SearchProvider = new PostgresSearchProvider();
