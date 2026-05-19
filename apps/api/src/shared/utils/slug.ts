import slugify from 'slugify';

export const createSlug = (value: string): string =>
  slugify(value, {
    lower: true,
    strict: true,
    trim: true
  });
