import { omanCities as omanCityOptions } from './oman-cities';

export const omanCityValues = omanCityOptions.map((city) => city.value);

export type ListingFormValues = {
  title: string;
  description: string;
  categoryId: string;
  city: string;
  price: string;
};

export type ListingValidationMessages = {
  titleRequired: string;
  titleMin: string;
  descriptionRequired: string;
  descriptionMin: string;
  categoryRequired: string;
  cityRequired: string;
  priceRequired: string;
  priceInvalid: string;
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function sanitizePriceInput(value: string): string {
  let next = value.replace(/[^\d.]/g, '');
  const firstDot = next.indexOf('.');
  if (firstDot !== -1) {
    next = next.slice(0, firstDot + 1) + next.slice(firstDot + 1).replace(/\./g, '');
  }
  const match = next.match(/^\d*(?:\.\d{0,3})?/);
  return match?.[0] ?? '';
}

export function parseListingPrice(value: string): number {
  return Number(value.replace(/,/g, '').trim() || '0');
}

export function isValidListingPrice(value: string): boolean {
  const normalized = value.replace(/,/g, '').trim();
  if (!normalized) return false;
  if (!/^\d+(\.\d{1,3})?$/.test(normalized)) return false;
  return parseListingPrice(normalized) >= 0;
}

export function validateListingForm(
  values: ListingFormValues,
  messages: ListingValidationMessages
): Record<string, string> {
  const errors: Record<string, string> = {};
  const title = values.title.trim();
  const description = values.description.trim();

  if (!title) errors.title = messages.titleRequired;
  else if (title.length < 3) errors.title = messages.titleMin;

  if (!description) errors.description = messages.descriptionRequired;
  else if (description.length < 10) errors.description = messages.descriptionMin;

  if (!values.categoryId || !uuidPattern.test(values.categoryId)) {
    errors.categoryId = messages.categoryRequired;
  }

  if (!values.city || !omanCityValues.includes(values.city as (typeof omanCityValues)[number])) {
    errors.city = messages.cityRequired;
  }

  const price = values.price.replace(/,/g, '').trim();
  if (!price) errors.price = messages.priceRequired;
  else if (!isValidListingPrice(values.price)) errors.price = messages.priceInvalid;

  return errors;
}
