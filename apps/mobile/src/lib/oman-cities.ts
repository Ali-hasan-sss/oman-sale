export const omanCities = [
  { value: 'مسقط', ar: 'مسقط', en: 'Muscat' },
  { value: 'صلالة', ar: 'صلالة', en: 'Salalah' },
  { value: 'صحار', ar: 'صحار', en: 'Sohar' },
  { value: 'نزوى', ar: 'نزوى', en: 'Nizwa' },
  { value: 'صور', ar: 'صور', en: 'Sur' },
  { value: 'البريمي', ar: 'البريمي', en: 'Al Buraimi' },
  { value: 'الرستاق', ar: 'الرستاق', en: 'Rustaq' },
  { value: 'السيب', ar: 'السيب', en: 'Seeb' },
  { value: 'الخوير', ar: 'الخوير', en: 'Al Khuwair' },
  { value: 'القرم', ar: 'القرم', en: 'Qurum' }
] as const;

export const getCityLabel = (value: string, locale: 'ar' | 'en') => {
  const city = omanCities.find((item) => item.value === value);
  if (!city) return value;
  return locale === 'en' ? city.en : city.ar;
};
