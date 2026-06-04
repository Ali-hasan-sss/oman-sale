export const omanCities = [
  'مسقط',
  'صلالة',
  'صحار',
  'نزوى',
  'صور',
  'البريمي',
  'الرستاق',
  'السيب',
  'الخوير',
  'القرم'
] as const;

export type OmanCity = (typeof omanCities)[number];
