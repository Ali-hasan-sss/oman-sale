export type ListingType =
  | 'PRODUCT'
  | 'SERVICE'
  | 'JOB'
  | 'JOB_REQUEST'
  | 'LOGISTICS'
  | 'CONSTRUCTION';

export type ApiResponse<T> = {
  data: T;
  message?: string;
};

export type PaginatedResponse<T> = ApiResponse<{
  items: T[];
  total: number;
  page: number;
  limit: number;
}>;
