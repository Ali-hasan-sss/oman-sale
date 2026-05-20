export type ApiEnvelope<T> = {
  data: T;
};

export type ApiListPage<T> = {
  items: T[];
  total?: number;
  page?: number;
  limit?: number;
};

export type PagedResult<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};
