export type OmanLocation = {
  value: string;
  ar: string;
  en: string;
};

export type OmanGovernorate = OmanLocation & {
  wilayahs: OmanLocation[];
};

export const omanGovernorates: OmanGovernorate[] = [
  {
    value: 'مسقط',
    ar: 'مسقط',
    en: 'Muscat',
    wilayahs: [
      { value: 'مسقط', ar: 'مسقط', en: 'Muscat' },
      { value: 'مطرح', ar: 'مطرح', en: 'Muttrah' },
      { value: 'بوشر', ar: 'بوشر', en: 'Bawshar' },
      { value: 'السيب', ar: 'السيب', en: 'Seeb' },
      { value: 'العامرات', ar: 'العامرات', en: 'Al Amerat' },
      { value: 'قريات', ar: 'قريات', en: 'Quriyat' }
    ]
  },
  {
    value: 'ظفار',
    ar: 'ظفار',
    en: 'Dhofar',
    wilayahs: [
      { value: 'صلالة', ar: 'صلالة', en: 'Salalah' },
      { value: 'طاقة', ar: 'طاقة', en: 'Taqah' },
      { value: 'مرباط', ar: 'مرباط', en: 'Mirbat' },
      { value: 'ثمريت', ar: 'ثمريت', en: 'Thumrait' },
      { value: 'ضلكوت', ar: 'ضلكوت', en: 'Dalkut' },
      { value: 'المزيونة', ar: 'المزيونة', en: 'Al Mazyunah' },
      { value: 'مقشن', ar: 'مقشن', en: 'Muqshin' },
      { value: 'شليم وجزر الحلانيات', ar: 'شليم وجزر الحلانيات', en: 'Shalim and Hallaniyat Islands' },
      { value: 'سدح', ar: 'سدح', en: 'Sadah' }
    ]
  },
  {
    value: 'مسندم',
    ar: 'مسندم',
    en: 'Musandam',
    wilayahs: [
      { value: 'خصب', ar: 'خصب', en: 'Khasab' },
      { value: 'بخا', ar: 'بخا', en: 'Bukha' },
      { value: 'دبا', ar: 'دبا', en: 'Dibba' },
      { value: 'مدحاء', ar: 'مدحاء', en: 'Madha' }
    ]
  },
  {
    value: 'البريمي',
    ar: 'البريمي',
    en: 'Al Buraimi',
    wilayahs: [
      { value: 'البريمي', ar: 'البريمي', en: 'Al Buraimi' },
      { value: 'محضة', ar: 'محضة', en: 'Mahdah' },
      { value: 'السنينة', ar: 'السنينة', en: 'As Sunaynah' }
    ]
  },
  {
    value: 'الداخلية',
    ar: 'الداخلية',
    en: 'Ad Dakhiliyah',
    wilayahs: [
      { value: 'نزوى', ar: 'نزوى', en: 'Nizwa' },
      { value: 'بهلاء', ar: 'بهلاء', en: 'Bahla' },
      { value: 'منح', ar: 'منح', en: 'Manah' },
      { value: 'أدم', ar: 'أدم', en: 'Adam' },
      { value: 'الحمراء', ar: 'الحمراء', en: 'Al Hamra' },
      { value: 'سمائل', ar: 'سمائل', en: 'Samail' },
      { value: 'إزكي', ar: 'إزكي', en: 'Izki' },
      { value: 'بدبد', ar: 'بدبد', en: 'Bidbid' }
    ]
  },
  {
    value: 'شمال الباطنة',
    ar: 'شمال الباطنة',
    en: 'North Al Batinah',
    wilayahs: [
      { value: 'صحار', ar: 'صحار', en: 'Sohar' },
      { value: 'الخابورة', ar: 'الخابورة', en: 'Al Khaburah' },
      { value: 'صحم', ar: 'صحم', en: 'Saham' },
      { value: 'السويق', ar: 'السويق', en: 'As Suwayq' },
      { value: 'لوى', ar: 'لوى', en: 'Liwa' },
      { value: 'شناص', ar: 'شناص', en: 'Shinas' }
    ]
  },
  {
    value: 'جنوب الباطنة',
    ar: 'جنوب الباطنة',
    en: 'South Al Batinah',
    wilayahs: [
      { value: 'الرستاق', ar: 'الرستاق', en: 'Rustaq' },
      { value: 'نخل', ar: 'نخل', en: 'Nakhal' },
      { value: 'وادي المعاول', ar: 'وادي المعاول', en: 'Wadi Al Maawil' },
      { value: 'المصنعة', ar: 'المصنعة', en: 'Al Musannah' },
      { value: 'عوقد', ar: 'عوقد', en: 'Awqad' },
      { value: 'بركاء', ar: 'بركاء', en: 'Barka' }
    ]
  },
  {
    value: 'شمال الشرقية',
    ar: 'شمال الشرقية',
    en: 'North Ash Sharqiyah',
    wilayahs: [
      { value: 'إبراء', ar: 'إبراء', en: 'Ibra' },
      { value: 'المضيبي', ar: 'المضيبي', en: 'Al Mudaybi' },
      { value: 'بدية', ar: 'بدية', en: 'Bidiyah' },
      { value: 'وادي بني خالد', ar: 'وادي بني خالد', en: 'Wadi Bani Khalid' },
      { value: 'دماء والطائيين', ar: 'دماء والطائيين', en: 'Dima and At Taiyyin' },
      { value: 'سناو', ar: 'سناو', en: 'Sinaw' }
    ]
  },
  {
    value: 'جنوب الشرقية',
    ar: 'جنوب الشرقية',
    en: 'South Ash Sharqiyah',
    wilayahs: [
      { value: 'صور', ar: 'صور', en: 'Sur' },
      { value: 'جعلان بني بوحسن', ar: 'جعلان بني بوحسن', en: 'Jaalan Bani Bu Hassan' },
      { value: 'جعلان بني بوعلي', ar: 'جعلان بني بوعلي', en: 'Jaalan Bani Bu Ali' },
      { value: 'الكامل والوفاق', ar: 'الكامل والوفاق', en: 'Al Kamil and Al Wafi' },
      { value: 'مصيرة', ar: 'مصيرة', en: 'Masirah' }
    ]
  },
  {
    value: 'الظاهرة',
    ar: 'الظاهرة',
    en: 'Ad Dhahirah',
    wilayahs: [
      { value: 'عبري', ar: 'عبري', en: 'Ibri' },
      { value: 'ينقل', ar: 'ينقل', en: 'Yanqul' },
      { value: 'ضنك', ar: 'ضنك', en: 'Dhank' }
    ]
  },
  {
    value: 'الوسطى',
    ar: 'الوسطى',
    en: 'Al Wusta',
    wilayahs: [
      { value: 'هيماء', ar: 'هيماء', en: 'Haima' },
      { value: 'محوت', ar: 'محوت', en: 'Mahout' },
      { value: 'الدقم', ar: 'الدقم', en: 'Duqm' },
      { value: 'الجازر', ar: 'الجازر', en: 'Al Jazer' }
    ]
  }
];

const legacyStoreCityMap: Record<string, { governorate: string; wilayah: string }> = {
  مسقط: { governorate: 'مسقط', wilayah: 'مسقط' },
  صلالة: { governorate: 'ظفار', wilayah: 'صلالة' },
  صحار: { governorate: 'شمال الباطنة', wilayah: 'صحار' },
  نزوى: { governorate: 'الداخلية', wilayah: 'نزوى' },
  صور: { governorate: 'جنوب الشرقية', wilayah: 'صور' },
  البريمي: { governorate: 'البريمي', wilayah: 'البريمي' },
  الرستاق: { governorate: 'جنوب الباطنة', wilayah: 'الرستاق' },
  السيب: { governorate: 'مسقط', wilayah: 'السيب' },
  الخوير: { governorate: 'مسقط', wilayah: 'مسقط' },
  القرم: { governorate: 'مسقط', wilayah: 'مسقط' }
};

export function findGovernorate(value: string | null | undefined) {
  if (!value) return undefined;
  return omanGovernorates.find((governorate) => governorate.value === value);
}

export function findWilayah(governorateValue: string | null | undefined, wilayahValue: string | null | undefined) {
  const governorate = findGovernorate(governorateValue);
  if (!governorate || !wilayahValue) return undefined;
  return governorate.wilayahs.find((wilayah) => wilayah.value === wilayahValue);
}

export function getWilayahsForGovernorate(governorateValue: string) {
  return findGovernorate(governorateValue)?.wilayahs ?? [];
}

export function getGovernorateLabel(value: string | null | undefined, locale: 'ar' | 'en') {
  if (!value) return '';
  const governorate = findGovernorate(value);
  if (governorate) return locale === 'en' ? governorate.en : governorate.ar;
  const legacy = legacyStoreCityMap[value];
  if (legacy) return getGovernorateLabel(legacy.governorate, locale);
  return value;
}

function findWilayahAnywhere(wilayahValue: string) {
  for (const governorate of omanGovernorates) {
    const wilayah = governorate.wilayahs.find((item) => item.value === wilayahValue);
    if (wilayah) return wilayah;
  }
  return undefined;
}

export function getWilayahLabel(
  governorateValue: string | null | undefined,
  wilayahValue: string | null | undefined,
  locale: 'ar' | 'en'
) {
  if (!wilayahValue) return '';
  const wilayah = findWilayah(governorateValue, wilayahValue) ?? findWilayahAnywhere(wilayahValue);
  if (wilayah) return locale === 'en' ? wilayah.en : wilayah.ar;
  return wilayahValue;
}

export const omanGovernorateValues = omanGovernorates.map((governorate) => governorate.value);

export const omanWilayahValues = omanGovernorates.flatMap((governorate) =>
  governorate.wilayahs.map((wilayah) => wilayah.value)
);

export function getListingLocationLabel(
  city: string | null | undefined,
  wilayah: string | null | undefined,
  area: string | null | undefined,
  locale: 'ar' | 'en'
) {
  if (wilayah || findGovernorate(city)) {
    return getStoreLocationLabel(city, wilayah, locale);
  }
  if (area) return area;
  return getStoreLocationLabel(city, null, locale) || city || '';
}

export function getStoreLocationLabel(
  city: string | null | undefined,
  wilayah: string | null | undefined,
  locale: 'ar' | 'en'
) {
  const normalized = city && findGovernorate(city) ? { governorate: city, wilayah } : legacyStoreCityMap[city ?? ''];
  const governorateValue = normalized?.governorate ?? city;
  const wilayahValue = normalized?.wilayah ?? wilayah ?? null;
  const governorateLabel = getGovernorateLabel(governorateValue, locale);
  const wilayahLabel = getWilayahLabel(governorateValue, wilayahValue, locale);

  if (governorateLabel && wilayahLabel && governorateLabel !== wilayahLabel) {
    return `${wilayahLabel}، ${governorateLabel}`;
  }

  return wilayahLabel || governorateLabel || getGovernorateLabel(city, locale) || city || '';
}
