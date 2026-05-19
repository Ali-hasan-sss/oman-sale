import { searchRepository } from './search.repository';
import type { SearchQuery } from './search.validation';

export interface SearchProvider {
  searchAds(query: SearchQuery): Promise<unknown>;
}

export class PostgresSearchProvider implements SearchProvider {
  searchAds(query: SearchQuery) {
    return searchRepository.searchAds(query);
  }
}

export const searchService: SearchProvider = new PostgresSearchProvider();
