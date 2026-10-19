export const BANNER_PLACEMENTS = [
  'HOME_BELOW_HERO',
  'HOME_BELOW_CATEGORIES',
  'HOME_BELOW_ARTICLES',
  'CATEGORIES',
  'OFFERS',
  'ARTICLES',
  'ARTICLE',
  'TOURISM',
  'DESTINATION',
  'STORES',
  'STORE',
  'SEARCH',
  'LISTING',
  'RAFFLE',
  'PRICING'
] as const;

export type BannerPlacement = (typeof BANNER_PLACEMENTS)[number];

type PlacementCopy = {
  admin: string;
  title: string;
  subtitle: string;
  requestTitle: string;
  requestSubtitle: string;
};

export const bannerPlacementCopy: Record<BannerPlacement, { ar: PlacementCopy; en: PlacementCopy }> = {
  HOME_BELOW_HERO: {
    ar: {
      admin: 'بنر الرئيسية الأول',
      title: 'عروض مميزة',
      subtitle: 'اكتشف عروضاً وإعلانات مختارة بعناية لتناسب اهتماماتك.',
      requestTitle: 'إعلان في بنر الرئيسية الأول',
      requestSubtitle: 'ارفع إعلانك ليظهر في بنر العروض المميزة بعد الدفع وموافقة الإدارة'
    },
    en: {
      admin: 'Homepage banner 1',
      title: 'Featured Offers',
      subtitle: 'Discover highlighted deals and announcements selected for you.',
      requestTitle: 'Ad in homepage banner 1',
      requestSubtitle: 'Submit your ad to appear in the featured offers banner after payment and admin approval'
    }
  },
  HOME_BELOW_CATEGORIES: {
    ar: {
      admin: 'بنر الرئيسية الثاني',
      title: 'بنر الرئيسية الثاني',
      subtitle: 'مساحة إعلانية في الصفحة الرئيسية.',
      requestTitle: 'إعلان في بنر الرئيسية الثاني',
      requestSubtitle: 'ارفع إعلانك ليظهر في بنر الرئيسية الثاني بعد الدفع وموافقة الإدارة'
    },
    en: {
      admin: 'Homepage banner 2',
      title: 'Homepage banner 2',
      subtitle: 'An advertising slot on the homepage.',
      requestTitle: 'Ad in homepage banner 2',
      requestSubtitle: 'Submit your ad to appear in homepage banner 2 after payment and admin approval'
    }
  },
  HOME_BELOW_ARTICLES: {
    ar: {
      admin: 'بنر الرئيسية الثالث',
      title: 'بنر الرئيسية الثالث',
      subtitle: 'مساحة إعلانية في الصفحة الرئيسية.',
      requestTitle: 'إعلان في بنر الرئيسية الثالث',
      requestSubtitle: 'ارفع إعلانك ليظهر في بنر الرئيسية الثالث بعد الدفع وموافقة الإدارة'
    },
    en: {
      admin: 'Homepage banner 3',
      title: 'Homepage banner 3',
      subtitle: 'An advertising slot on the homepage.',
      requestTitle: 'Ad in homepage banner 3',
      requestSubtitle: 'Submit your ad to appear in homepage banner 3 after payment and admin approval'
    }
  },
  CATEGORIES: {
    ar: {
      admin: 'صفحة الفئات',
      title: 'إعلان صفحة الفئات',
      subtitle: 'يظهر أعلى صفحة تصفح الفئة.',
      requestTitle: 'إعلان في بنر صفحة الفئات',
      requestSubtitle: 'يظهر إعلانك في صفحات الفئات بعد الدفع وموافقة الإدارة'
    },
    en: {
      admin: 'Categories page',
      title: 'Categories page ad',
      subtitle: 'Shown at the top of a category page.',
      requestTitle: 'Ad in the categories page banner',
      requestSubtitle: 'Your ad appears on category pages after payment and admin approval'
    }
  },
  OFFERS: {
    ar: {
      admin: 'صفحة العروض',
      title: 'إعلان صفحة العروض',
      subtitle: 'يظهر أعلى صفحة جميع العروض.',
      requestTitle: 'إعلان في بنر صفحة العروض',
      requestSubtitle: 'يظهر إعلانك في صفحة العروض بعد الدفع وموافقة الإدارة'
    },
    en: {
      admin: 'Offers page',
      title: 'Offers page ad',
      subtitle: 'Shown at the top of the offers page.',
      requestTitle: 'Ad in the offers page banner',
      requestSubtitle: 'Your ad appears on the offers page after payment and admin approval'
    }
  },
  ARTICLES: {
    ar: {
      admin: 'صفحة المقالات',
      title: 'إعلان صفحة المقالات',
      subtitle: 'يظهر أعلى صفحة المقالات.',
      requestTitle: 'إعلان في بنر صفحة المقالات',
      requestSubtitle: 'يظهر إعلانك في صفحة المقالات بعد الدفع وموافقة الإدارة'
    },
    en: {
      admin: 'Articles page',
      title: 'Articles page ad',
      subtitle: 'Shown at the top of the articles page.',
      requestTitle: 'Ad in the articles page banner',
      requestSubtitle: 'Your ad appears on the articles page after payment and admin approval'
    }
  },
  ARTICLE: {
    ar: {
      admin: 'صفحة المقال',
      title: 'إعلان صفحة المقال',
      subtitle: 'يظهر أعلى صفحة تفاصيل المقال.',
      requestTitle: 'إعلان في بنر صفحة المقال',
      requestSubtitle: 'يظهر إعلانك في صفحات المقالات بعد الدفع وموافقة الإدارة'
    },
    en: {
      admin: 'Article page',
      title: 'Article page ad',
      subtitle: 'Shown at the top of an article.',
      requestTitle: 'Ad in the article page banner',
      requestSubtitle: 'Your ad appears on article pages after payment and admin approval'
    }
  },
  TOURISM: {
    ar: {
      admin: 'صفحة السياحة',
      title: 'إعلان صفحة السياحة',
      subtitle: 'يظهر في صفحة الوجهات السياحية.',
      requestTitle: 'إعلان في بنر صفحة السياحة',
      requestSubtitle: 'يظهر إعلانك في صفحة السياحة بعد الدفع وموافقة الإدارة'
    },
    en: {
      admin: 'Tourism page',
      title: 'Tourism page ad',
      subtitle: 'Shown on the tourism destinations page.',
      requestTitle: 'Ad in the tourism page banner',
      requestSubtitle: 'Your ad appears on the tourism page after payment and admin approval'
    }
  },
  DESTINATION: {
    ar: {
      admin: 'صفحة الوجهة',
      title: 'إعلان صفحة الوجهة',
      subtitle: 'يظهر في صفحة تفاصيل الوجهة السياحية.',
      requestTitle: 'إعلان في بنر صفحة الوجهة',
      requestSubtitle: 'يظهر إعلانك في صفحات الوجهات بعد الدفع وموافقة الإدارة'
    },
    en: {
      admin: 'Destination page',
      title: 'Destination page ad',
      subtitle: 'Shown on a destination details page.',
      requestTitle: 'Ad in the destination page banner',
      requestSubtitle: 'Your ad appears on destination pages after payment and admin approval'
    }
  },
  STORES: {
    ar: {
      admin: 'صفحة المتاجر',
      title: 'إعلان صفحة المتاجر',
      subtitle: 'يظهر أعلى صفحة المتاجر.',
      requestTitle: 'إعلان في بنر صفحة المتاجر',
      requestSubtitle: 'يظهر إعلانك في صفحة المتاجر بعد الدفع وموافقة الإدارة'
    },
    en: {
      admin: 'Stores page',
      title: 'Stores page ad',
      subtitle: 'Shown at the top of the stores page.',
      requestTitle: 'Ad in the stores page banner',
      requestSubtitle: 'Your ad appears on the stores page after payment and admin approval'
    }
  },
  STORE: {
    ar: {
      admin: 'صفحة المتجر',
      title: 'إعلان صفحة المتجر',
      subtitle: 'يظهر في صفحة المتجر.',
      requestTitle: 'إعلان في بنر صفحة المتجر',
      requestSubtitle: 'يظهر إعلانك في صفحات المتاجر بعد الدفع وموافقة الإدارة'
    },
    en: {
      admin: 'Store page',
      title: 'Store page ad',
      subtitle: 'Shown on a store page.',
      requestTitle: 'Ad in the store page banner',
      requestSubtitle: 'Your ad appears on store pages after payment and admin approval'
    }
  },
  SEARCH: {
    ar: {
      admin: 'صفحة البحث',
      title: 'إعلان صفحة البحث',
      subtitle: 'يظهر في صفحة نتائج البحث.',
      requestTitle: 'إعلان في بنر صفحة البحث',
      requestSubtitle: 'يظهر إعلانك في صفحة البحث بعد الدفع وموافقة الإدارة'
    },
    en: {
      admin: 'Search page',
      title: 'Search page ad',
      subtitle: 'Shown on the search results page.',
      requestTitle: 'Ad in the search page banner',
      requestSubtitle: 'Your ad appears on the search page after payment and admin approval'
    }
  },
  LISTING: {
    ar: {
      admin: 'صفحة العرض',
      title: 'إعلان صفحة العرض',
      subtitle: 'يظهر أعلى صفحة تفاصيل العرض.',
      requestTitle: 'إعلان في بنر صفحة العرض',
      requestSubtitle: 'يظهر إعلانك في صفحات العروض بعد الدفع وموافقة الإدارة'
    },
    en: {
      admin: 'Listing page',
      title: 'Listing page ad',
      subtitle: 'Shown at the top of a listing.',
      requestTitle: 'Ad in the listing page banner',
      requestSubtitle: 'Your ad appears on listing pages after payment and admin approval'
    }
  },
  RAFFLE: {
    ar: {
      admin: 'صفحة السحب',
      title: 'إعلان صفحة السحب',
      subtitle: 'يظهر في صفحة السحب.',
      requestTitle: 'إعلان في بنر صفحة السحب',
      requestSubtitle: 'يظهر إعلانك في صفحة السحب بعد الدفع وموافقة الإدارة'
    },
    en: {
      admin: 'Raffle page',
      title: 'Raffle page ad',
      subtitle: 'Shown on the raffle page.',
      requestTitle: 'Ad in the raffle page banner',
      requestSubtitle: 'Your ad appears on the raffle page after payment and admin approval'
    }
  },
  PRICING: {
    ar: {
      admin: 'صفحة الأسعار',
      title: 'إعلان صفحة الأسعار',
      subtitle: 'يظهر في صفحة الأسعار.',
      requestTitle: 'إعلان في بنر صفحة الأسعار',
      requestSubtitle: 'يظهر إعلانك في صفحة الأسعار بعد الدفع وموافقة الإدارة'
    },
    en: {
      admin: 'Pricing page',
      title: 'Pricing page ad',
      subtitle: 'Shown on the pricing page.',
      requestTitle: 'Ad in the pricing page banner',
      requestSubtitle: 'Your ad appears on the pricing page after payment and admin approval'
    }
  }
};

export function isBannerPlacement(value: string | null | undefined): value is BannerPlacement {
  return BANNER_PLACEMENTS.includes(value as BannerPlacement);
}

export function readBannerPlacement(value: string | null | undefined): BannerPlacement {
  return isBannerPlacement(value) ? value : 'HOME_BELOW_HERO';
}
