import { isAxiosError } from 'axios';

export const ApiErrorCodes = {
  ACCOUNT_BLOCKED: 'ACCOUNT_BLOCKED',
  ACCOUNT_INACTIVE: 'ACCOUNT_INACTIVE',
  EMAIL_VERIFICATION_REQUIRED: 'EMAIL_VERIFICATION_REQUIRED',
  STORE_LISTING_LIMIT_REACHED: 'STORE_LISTING_LIMIT_REACHED',
  STORE_LIMIT_REACHED: 'STORE_LIMIT_REACHED',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  SESSION_EXPIRED: 'SESSION_EXPIRED'
} as const;

export type ApiErrorCode = (typeof ApiErrorCodes)[keyof typeof ApiErrorCodes];

type ZodIssue = {
  path: (string | number)[];
  code: string;
  message?: string;
  minimum?: number;
};

type ApiErrorPayload = {
  message?: string;
  code?: string | { issues?: ZodIssue[] };
  details?: { issues?: ZodIssue[] };
};

type ErrorMessages = Record<string, string>;

function extractZodIssues(error: unknown): ZodIssue[] {
  if (!isAxiosError<ApiErrorPayload>(error)) return [];

  const data = error.response?.data;
  const detailsIssues = data?.details?.issues;
  if (Array.isArray(detailsIssues)) return detailsIssues;

  const code = data?.code;
  if (code && typeof code === 'object' && Array.isArray(code.issues)) {
    return code.issues;
  }

  return [];
}

function mapZodIssueToMessageKey(issue: ZodIssue): string {
  const field = String(issue.path[0] ?? '');

  if (field === 'title') {
    return issue.code === 'too_small' ? 'fieldTitleMin' : 'fieldTitleRequired';
  }
  if (field === 'description') {
    return issue.code === 'too_small' ? 'fieldDescriptionMin' : 'fieldDescriptionRequired';
  }
  if (field === 'categoryId') return 'fieldCategoryRequired';
  if (field === 'city') return 'fieldCityRequired';
  if (field === 'wilayah') {
    return issue.message?.toLowerCase().includes('belong') ? 'fieldWilayahMismatch' : 'fieldWilayahRequired';
  }
  if (field === 'price') return issue.code === 'invalid_type' ? 'fieldPriceInvalid' : 'fieldPriceRequired';
  if (field === 'modelYear') return 'fieldModelYearRequired';
  if (field === 'imageUrls' || field === 'videoUrl') return 'fieldMediaInvalid';
  if (field === 'filterOptionIds') return 'fieldFilterRequired';
  if (field === 'nameAr') return 'fieldStoreNameAr';
  if (field === 'nameEn') return 'fieldStoreNameEn';
  if (field === 'phone') return 'fieldStorePhone';
  if (field === 'nationalId') return 'fieldStoreNationalId';
  if (field === 'storeTypeId') return 'fieldStoreType';
  if (field === 'rootCategoryId') return 'fieldCategoryRequired';
  if (field === 'planId') return 'fieldStorePlan';
  if (field === 'commercialRegistrationNumber') return 'fieldStoreCr';

  return 'VALIDATION_FAILED';
}

export function getValidationFieldErrors(error: unknown, messages: ErrorMessages): Record<string, string> {
  const result: Record<string, string> = {};

  for (const issue of extractZodIssues(error)) {
    const field = String(issue.path[0] ?? '');
    if (!field || result[field]) continue;

    const messageKey = mapZodIssueToMessageKey(issue);
    result[field] = messages[messageKey] ?? messages.VALIDATION_FAILED ?? messages.generic ?? '';
  }

  return result;
}

export function resolveApiErrorMessage(error: unknown, messages: ErrorMessages, fallback: string) {
  if (isAxiosError<ApiErrorPayload>(error)) {
    const code = error.response?.data?.code;
    const stringCode = typeof code === 'string' ? code : undefined;

    const fieldErrors = getValidationFieldErrors(error, messages);
    const firstFieldError = Object.values(fieldErrors).find(Boolean);
    if (stringCode === 'VALIDATION_FAILED' && firstFieldError) return firstFieldError;

    if (error.response?.status === 429 && messages.RATE_LIMITED) return messages.RATE_LIMITED;

    if (stringCode && messages[stringCode]) return messages[stringCode];

    if (firstFieldError) return firstFieldError;

    if (error.response?.data?.message && error.response.data.message !== 'Account is not allowed') {
      return error.response.data.message;
    }
  }

  return fallback;
}

const apiCodeField: Record<string, string> = {
  CATEGORY_FILTER_REQUIRED: 'filters',
  CATEGORY_FILTER_INVALID: 'filters',
  CATEGORY_SUBCATEGORY_REQUIRED: 'subcategoryPath',
  CATEGORY_NOT_FOUND: 'categoryId',
  MODEL_YEAR_REQUIRED: 'modelYear',
  MODEL_YEAR_INVALID: 'modelYear',
  PHONE_VERIFICATION_REQUIRED: 'phone'
};

const apiCodeMessageKey: Record<string, string> = {
  CATEGORY_FILTER_REQUIRED: 'fieldFilterRequired',
  CATEGORY_FILTER_INVALID: 'fieldFilterRequired',
  CATEGORY_SUBCATEGORY_REQUIRED: 'fieldSubcategoryRequired',
  CATEGORY_NOT_FOUND: 'fieldCategoryRequired',
  MODEL_YEAR_REQUIRED: 'fieldModelYearRequired',
  MODEL_YEAR_INVALID: 'fieldModelYearRequired',
  PHONE_VERIFICATION_REQUIRED: 'PHONE_VERIFICATION_REQUIRED'
};

export function getApiCodeFieldErrors(error: unknown, messages: ErrorMessages): Record<string, string> {
  const code = getApiErrorCode(error);
  if (!code) return {};
  const field = apiCodeField[code];
  const messageKey = apiCodeMessageKey[code];
  if (!field || !messageKey) return {};
  const message = messages[messageKey] || messages[code] || messages.VALIDATION_FAILED || messages.generic || '';
  return message ? { [field]: message } : {};
}

export function getApiErrorCode(error: unknown): string | undefined {
  if (isAxiosError<ApiErrorPayload>(error)) {
    if (error.response?.status === 429) return 'RATE_LIMITED';
    const code = error.response?.data?.code;
    return typeof code === 'string' ? code : undefined;
  }
  return undefined;
}

export function isAccountBlockedError(error: unknown) {
  return getApiErrorCode(error) === ApiErrorCodes.ACCOUNT_BLOCKED;
}

export function isAccountInactiveError(error: unknown) {
  return getApiErrorCode(error) === ApiErrorCodes.ACCOUNT_INACTIVE;
}
