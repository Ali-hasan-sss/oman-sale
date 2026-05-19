import type { Request, Response } from 'express';

import { searchService } from './search.service';
import type { SearchQuery } from './search.validation';

export class SearchController {
  async searchAds(req: Request, res: Response) {
    res.json({ data: await searchService.searchAds(req.query as unknown as SearchQuery) });
  }
}

export const searchController = new SearchController();
