import { isAxiosError } from 'axios';

export const ApiErrorCodes = {
  ACCOUNT_BLOCKED: 'ACCOUNT_BLOCKED',
  ACCOUNT_INACTIVE: 'ACCOUNT_INACTIVE',
  EMAIL_VERIFICATION_REQUIRED: 'EMAIL_VERIFICATION_REQUIRED',
  STORE_LISTING_LIMIT_REACHED: 'STORE_LISTING_LIMIT_REACHED',
  STORE_LIMIT_REACHED: 'STORE_LIMIT_REACHED',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  ASSISTANT_DAILY_LIMIT_REACHED: 'ASSISTANT_DAILY_LIMIT_REACHED'
} as const;

export type ApiErrorCode = (typeof ApiErrorCodes)[keyof typeof ApiErrorCodes];

type ZodIssue = {
  path: (string | number)[];
  code: string;
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
  if (field === 'wilayah') return 'fieldWilayahRequired';
  if (field === 'price') return 'fieldPriceInvalid';

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

    if (stringCode && messages[stringCode]) return messages[stringCode];

    const fieldErrors = getValidationFieldErrors(error, messages);
    const firstFieldError = Object.values(fieldErrors).find(Boolean);
    if (firstFieldError) return firstFieldError;

    if (error.response?.data?.message && error.response.data.message !== 'Account is not allowed') {
      return error.response.data.message;
    }
  }

  return fallback;
}

export function getApiErrorCode(error: unknown): string | undefined {
  if (isAxiosError<ApiErrorPayload>(error)) {
    const code = error.response?.data?.code;
    return typeof code === 'string' ? code : undefined;
  }
  return undefined;
}

export function isAssistantMessagesTooLongError(error: unknown) {
  return extractZodIssues(error).some(
    (issue) => issue.path[0] === 'messages' && (issue.code === 'too_big' || issue.code === 'too_small')
  );
}

export function isAccountBlockedError(error: unknown) {
  return getApiErrorCode(error) === ApiErrorCodes.ACCOUNT_BLOCKED;
}

export function isAccountInactiveError(error: unknown) {
  return getApiErrorCode(error) === ApiErrorCodes.ACCOUNT_INACTIVE;
}
