import type { Locale } from '@/lib/i18n';

export type TourismDestination = {
  id: string;
  image: string;
  title: Record<Locale, string>;
};

export type TourismDestinationDetails = {
  rating: string;
  ratingLabel: Record<Locale, string>;
  aboutTitle: Record<Locale, string>;
  about: Record<Locale, string>;
  highlightsTitle: Record<Locale, string>;
  highlights: Record<Locale, string[]>;
  activitiesTitle: Record<Locale, string>;
  activities: Record<Locale, string[]>;
  bestTimeTitle: Record<Locale, string>;
  bestTime: Record<Locale, string>;
  contactTitle: Record<Locale, string>;
  phone: string;
  email: string;
  address: Record<Locale, string>;
  quickLinksTitle: Record<Locale, string>;
};

export type TourismFeature = {
  icon: string;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
};

export const tourismPageContent = {
  ar: {
    title: 'المعالم السياحية في سلطنة عمان',
    subtitle: 'اكتشف جمال عمان الساحر وتاريخها العريق',
    heroTitle: 'استكشف عمان الجميلة',
    heroDescription:
      'من الجبال الشاهقة إلى الشواطئ الساحرة، من الصحاري الذهبية إلى الوديان الخضراء، تقدم سلطنة عمان تجربة سياحية فريدة تجمع بين التاريخ والطبيعة'
  },
  en: {
    title: 'Tourist Landmarks in Oman',
    subtitle: 'Discover Oman’s enchanting beauty and rich history',
    heroTitle: 'Explore Beautiful Oman',
    heroDescription:
      'From towering mountains to charming beaches, from golden deserts to green wadis, Oman offers a unique tourism experience that blends history and nature.'
  }
} as const;

export const tourismDestinations: TourismDestination[] = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1591604129842-1a784c5db2f1?w=400&h=300&fit=crop',
    title: { ar: 'جامع السلطان قابوس الأكبر', en: 'Sultan Qaboos Grand Mosque' }
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1584469125998-50c49c0d2261?w=400&h=300&fit=crop',
    title: { ar: 'وادي شاب', en: 'Wadi Shab' }
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?w=400&h=300&fit=crop',
    title: { ar: 'رمال وهيبة', en: 'Wahiba Sands' }
  },
  {
    id: '4',
    image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=300&fit=crop',
    title: { ar: 'خور الدهاريز', en: 'Dahariz Lagoon' }
  },
  {
    id: '5',
    image: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=400&h=300&fit=crop',
    title: { ar: 'قلعة نزوى', en: 'Nizwa Fort' }
  },
  {
    id: '6',
    image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=300&fit=crop',
    title: { ar: 'شاطئ القرم الطبيعي', en: 'Qurum Natural Beach' }
  },
  {
    id: '7',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
    title: { ar: 'جبل شمس', en: 'Jebel Shams' }
  },
  {
    id: '8',
    image: 'https://images.unsplash.com/photo-1508433957232-3107f5fd5995?w=400&h=300&fit=crop',
    title: { ar: 'كهف الهوتة', en: 'Al Hoota Cave' }
  }
];

export const tourismFeatures: TourismFeature[] = [
  {
    icon: '🏛️',
    title: { ar: 'تراث عريق', en: 'Rich Heritage' },
    description: {
      ar: 'اكتشف القلاع والحصون التاريخية التي تروي قصص الماضي',
      en: 'Explore historic castles and forts that tell stories from the past.'
    }
  },
  {
    icon: '🏖️',
    title: { ar: 'شواطئ ساحرة', en: 'Charming Beaches' },
    description: {
      ar: 'استمتع بالشواطئ الخلابة والمياه الفيروزية الصافية',
      en: 'Enjoy stunning beaches and clear turquoise waters.'
    }
  },
  {
    icon: '⛰️',
    title: { ar: 'طبيعة خلابة', en: 'Breathtaking Nature' },
    description: {
      ar: 'جبال شاهقة ووديان خضراء وصحاري ذهبية تأسر القلوب',
      en: 'Towering mountains, green wadis, and golden deserts that capture the heart.'
    }
  }
];

const baseDetails = (
  arName: string,
  enName: string,
  bestTimeAr: string,
  bestTimeEn: string,
  addressAr: string,
  addressEn: string
): TourismDestinationDetails => ({
  rating: '4.9',
  ratingLabel: { ar: 'تقييم ممتاز', en: 'Excellent rating' },
  aboutTitle: { ar: `عن ${arName}`, en: `About ${enName}` },
  about: {
    ar: `${arName} من أبرز الوجهات السياحية في سلطنة عمان، ويجمع بين الجمال الطبيعي والهوية العمانية الأصيلة ليمنح الزائر تجربة لا تنسى.`,
    en: `${enName} is one of Oman’s standout tourism destinations, blending natural beauty with authentic Omani character for a memorable visit.`
  },
  highlightsTitle: { ar: 'أبرز المعالم', en: 'Top highlights' },
  highlights: {
    ar: ['مناظر طبيعية مميزة', 'تجربة ثقافية عمانية', 'مواقع تصوير رائعة', 'أجواء مناسبة للعائلات'],
    en: ['Distinctive landscapes', 'Omani cultural experience', 'Great photo spots', 'Family-friendly atmosphere']
  },
  activitiesTitle: { ar: 'الأنشطة والفعاليات', en: 'Activities' },
  activities: {
    ar: ['استكشاف المكان سيراً على الأقدام', 'التقاط الصور التذكارية', 'زيارة الأسواق والمناطق القريبة', 'الاستمتاع بالأجواء الطبيعية'],
    en: ['Explore the area on foot', 'Take memorable photos', 'Visit nearby markets and areas', 'Enjoy the natural atmosphere']
  },
  bestTimeTitle: { ar: 'أفضل وقت للزيارة', en: 'Best time to visit' },
  bestTime: { ar: bestTimeAr, en: bestTimeEn },
  contactTitle: { ar: 'معلومات الاتصال', en: 'Contact information' },
  phone: '+968 2456 7890',
  email: 'info@omantourism.om',
  address: { ar: addressAr, en: addressEn },
  quickLinksTitle: { ar: 'روابط سريعة', en: 'Quick links' }
});

export const tourismDestinationDetails: Record<string, TourismDestinationDetails> = {
  '1': baseDetails(
    'جامع السلطان قابوس الأكبر',
    'Sultan Qaboos Grand Mosque',
    'من أكتوبر إلى أبريل',
    'October to April',
    'مسقط، سلطنة عمان',
    'Muscat, Sultanate of Oman'
  ),
  '2': baseDetails('وادي شاب', 'Wadi Shab', 'من أكتوبر إلى مارس', 'October to March', 'ولاية صور، سلطنة عمان', 'Sur, Sultanate of Oman'),
  '3': baseDetails('رمال وهيبة', 'Wahiba Sands', 'من نوفمبر إلى فبراير', 'November to February', 'شمال الشرقية، سلطنة عمان', 'North Sharqiyah, Sultanate of Oman'),
  '4': baseDetails('خور الدهاريز', 'Dahariz Lagoon', 'من يونيو إلى سبتمبر', 'June to September', 'صلالة، سلطنة عمان', 'Salalah, Sultanate of Oman'),
  '5': baseDetails('قلعة نزوى', 'Nizwa Fort', 'من أكتوبر إلى أبريل', 'October to April', 'نزوى، سلطنة عمان', 'Nizwa, Sultanate of Oman'),
  '6': baseDetails('شاطئ القرم الطبيعي', 'Qurum Natural Beach', 'من أكتوبر إلى أبريل', 'October to April', 'القرم، مسقط', 'Qurum, Muscat'),
  '7': baseDetails('جبل شمس', 'Jebel Shams', 'من سبتمبر إلى مايو', 'September to May', 'الداخلية، سلطنة عمان', 'Ad Dakhiliyah, Sultanate of Oman'),
  '8': baseDetails('كهف الهوتة', 'Al Hoota Cave', 'طوال العام', 'Year-round', 'الحمراء، سلطنة عمان', 'Al Hamra, Sultanate of Oman')
};
