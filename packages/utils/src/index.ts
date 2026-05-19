import slugify from 'slugify';

export const createSlug = (value: string): string =>
  slugify(value, {
    lower: true,
    strict: true,
    trim: true
  });

export const omitUndefined = <T extends Record<string, unknown>>(input: T): Partial<T> =>
  Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined)) as Partial<T>;
