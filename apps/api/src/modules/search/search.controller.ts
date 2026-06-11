import type { Request, Response } from 'express';

import { searchService } from './search.service';
import type { SearchQuery, SearchSuggestionsQuery } from './search.validation';

export class SearchController {
  async searchAds(req: Request, res: Response) {
    res.json({ data: await searchService.searchAds(req.query as unknown as SearchQuery) });
  }

  async suggestions(req: Request, res: Response) {
    res.json({ data: await searchService.getSuggestions(req.query as unknown as SearchSuggestionsQuery) });
  }
}

export const searchController = new SearchController();
