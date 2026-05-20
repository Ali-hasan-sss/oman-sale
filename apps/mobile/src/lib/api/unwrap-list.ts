import type { ApiListPage } from './types';

/** API may return `{ items: T[] }` or a bare `T[]` depending on the endpoint. */
export function unwrapListItems<T>(data: ApiListPage<T> | T[] | null | undefined): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.items ?? [];
}
