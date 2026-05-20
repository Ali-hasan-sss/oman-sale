import type { ApiListPage } from './api/types';
import type { PagedResult } from './api/types';

export function normalizePage<T>(data: ApiListPage<T>, page: number, limit: number): PagedResult<T> {
  const items = Array.isArray(data.items) ? data.items : [];
  const total = typeof data.total === 'number' ? data.total : items.length;
  return {
    items,
    total,
    page: data.page ?? page,
    limit: data.limit ?? limit
  };
}

export function hasMorePages(loadedCount: number, lastBatchSize: number, limit: number, total: number) {
  if (lastBatchSize < limit) return false;
  return loadedCount < total;
}
