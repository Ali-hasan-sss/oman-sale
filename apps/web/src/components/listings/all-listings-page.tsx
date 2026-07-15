'use client';

import { ChevronDown, MapPin } from 'lucide-react';
import Link from 'next/link';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { SiteFooter } from '@/components/home/site-footer';
import { SiteHeaderSearch, UserSiteHeader } from '@/components/navigation/user-site-header';
import { api } from '@/lib/api';
import {
  buildSubcategoryFilterLevels,
  getEffectiveCategoryId,
  isCategoryUnderSlug,
  MODEL_YEAR_MAX,
  MODEL_YEAR_MIN,
  PASSENGER_CARS_SLUG,
  selectFilterOption,
  updateSubcategoryPath
} from '@/lib/category-subcategory-filters';
import { buildCategoryTree } from '@/lib/category-tree';
import { useI18n } from '@/lib/i18n';
import { getListingLocationLabel, getWilayahsForGovernorate, omanGovernorates } from '@/lib/oman-locations';
import { useSiteHeaderOffset } from '@/hooks/use-site-header-offset';
import { getUserAccessToken } from '@/lib/user-auth';
import { FavoriteButton } from './favorite-button';
import { ListingCardsSkeleton } from './listing-card-skeleton';
import { ListingMediaCover } from './listing-media-cover';
import { ListingTitleWithVerified } from '@/components/trust-badge/listing-verified-badge';

type Category = {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  sortOrder?: number;
};

type Listing = {
  id: string;
  title: string;
  price?: string | number | null;
  currency: string;
  city?: string | null;
  wilayah?: string | null;
  area?: string | null;
  views: number;
  category?: {
    id: string;
    name: string;
    nameAr?: string;
    nameEn?: string;
  };
  images?: Array<{ imageUrl: string; mediaType?: 'IMAGE' | 'VIDEO' }>;
  promotion?: {
    plan?: {
      badgeLabel?: string | null;
      color?: string | null;
    };
  } | null;
  store?: {
    id: string;
    nameAr: string;
    nameEn: string;
    slug: string;
    logoUrl?: string | null;
    trustBadgeApproved?: boolean;
  } | null;
  trustBadgeApproved?: boolean;
};

type ListingsResponse = {
  items: Listing[];
  total: number;
  page: number;
  limit: number;
};

type CategoryFilter = {
  id: string;
  slug: string;
  title: string;
  options: Array<{
    id: string;
    label: string;
  }>;
};

const modelYearFloor = MODEL_YEAR_MIN;
const modelYearCeiling = MODEL_YEAR_MAX;

const priceFloor = 0;
const priceCeiling = 100000;
const priceStep = 100;
const priceScalePresets = [100, 200, 500, 1000, 5000, 10000, priceCeiling] as const;
const defaultPriceScale = 1000;

const listingsPageMessages = {
  ar: {
    title: 'جميع الإعلانات',
    available: 'إعلان متاح',
    all: 'الكل',
    filter: 'تصفية',
    filters: 'الفلاتر',
    clearAll: 'عرض الكل',
    subcategories: 'الفئة الفرعية',
    moreFilters: 'المزيد من الخيارات',
    sortBy: 'الترتيب حسب:',
    recent: 'الأحدث',
    priceLow: 'السعر: من الأقل للأعلى',
    priceHigh: 'السعر: من الأعلى للأقل',
    popular: 'الأكثر مشاهدة',
    selectCity: 'المحافظة',
    selectWilayah: 'الولاية / المنطقة',
    allWilayahsInGovernorate: 'كل ولايات المحافظة',
    priceRange: 'نطاق السعر',
    priceScale: 'مقياس السعر',
    modelYearRange: 'سنة الصنع',
    applyFilters: 'تطبيق الفلاتر',
    resetFilters: 'إعادة تعيين',
    loadMore: 'تحميل المزيد',
    loading: 'جاري تحميل الإعلانات...',
    empty: 'لا توجد إعلانات مطابقة للفلاتر الحالية'
  },
  en: {
    title: 'All listings',
    available: 'available listings',
    all: 'All',
    filter: 'Filter',
    filters: 'Filters',
    clearAll: 'Clear all',
    subcategories: 'Subcategory',
    moreFilters: 'More options',
    sortBy: 'Sort by:',
    recent: 'Newest',
    priceLow: 'Price: low to high',
    priceHigh: 'Price: high to low',
    popular: 'Most viewed',
    selectCity: 'Governorate',
    selectWilayah: 'Wilayah',
    allWilayahsInGovernorate: 'All wilayahs in governorate',
    priceRange: 'Price range',
    priceScale: 'Price scale',
    modelYearRange: 'Model year',
    applyFilters: 'Apply filters',
    resetFilters: 'Reset',
    loadMore: 'Load more',
    loading: 'Loading listings...',
    empty: 'No listings match the current filters'
  }
};

const fallbackImage = '/logo.png';

export function AllListingsPage({ categorySlug }: { categorySlug?: string } = {}) {
  const { dir, locale, localizedPath } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlSearch = (searchParams.get('q') ?? '').trim();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [listings, setListings] = useState<Listing[]>([]);
  const [categoryFilters, setCategoryFilters] = useState<CategoryFilter[]>([]);
  const [selectedSubcategoryPath, setSelectedSubcategoryPath] = useState<string[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedFilterOptionIds, setSelectedFilterOptionIds] = useState<string[]>([]);
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedCategoryId, setAppliedCategoryId] = useState('');
  const [appliedCity, setAppliedCity] = useState('');
  const [appliedWilayah, setAppliedWilayah] = useState('');
  const [appliedMinPrice, setAppliedMinPrice] = useState('');
  const [appliedMaxPrice, setAppliedMaxPrice] = useState('');
  const [appliedMinModelYear, setAppliedMinModelYear] = useState('');
  const [appliedMaxModelYear, setAppliedMaxModelYear] = useState('');
  const [city, setCity] = useState('');
  const [wilayah, setWilayah] = useState('');
  const [minPrice, setMinPrice] = useState(priceFloor);
  const [maxPrice, setMaxPrice] = useState(defaultPriceScale);
  const [minModelYear, setMinModelYear] = useState(modelYearFloor);
  const [maxModelYear, setMaxModelYear] = useState(modelYearCeiling);
  const [sort, setSort] = useState('recent');
  const [priceScale, setPriceScale] = useState(defaultPriceScale);
  const [page, setPage] = useState(1);
  const headerOffset = useSiteHeaderOffset();
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const decodedCategorySlug = categorySlug ? decodeURIComponent(categorySlug) : undefined;
  const activeCategory = decodedCategorySlug
    ? categories.find((category) => category.slug === decodedCategorySlug)
    : undefined;
  const isCategoryPage = Boolean(decodedCategorySlug);
  const rootCategories = useMemo(() => buildCategoryTree(categories), [categories]);
  const rootCategoryId = isCategoryPage ? (activeCategory?.id ?? '') : appliedCategoryId || selectedCategoryId;
  const effectiveCategoryId = rootCategoryId
    ? getEffectiveCategoryId(rootCategoryId, selectedSubcategoryPath)
    : '';
  const subcategoryLevels = isCategoryPage
    ? buildSubcategoryFilterLevels(
        categories,
        rootCategoryId,
        selectedSubcategoryPath,
        (category) => category.name,
        listingsPageMessages[locale].subcategories
      )
    : [];
  const allListingsSubcategoryLevels =
    !isCategoryPage && rootCategoryId
      ? buildSubcategoryFilterLevels(
          categories,
          rootCategoryId,
          selectedSubcategoryPath,
          (category) => category.name,
          listingsPageMessages[locale].subcategories
        )
      : [];
  const isPassengerCarsCategory = useMemo(
    () =>
      effectiveCategoryId
        ? isCategoryUnderSlug(categories, effectiveCategoryId, PASSENGER_CARS_SLUG)
        : false,
    [categories, effectiveCategoryId]
  );

  useEffect(() => {
    setIsLoadingCategories(true);
    api
      .get<{ data: Category[] }>('/categories', { params: { locale } })
      .then((response) => setCategories(response.data.data))
      .catch(() => setCategories([]))
      .finally(() => setIsLoadingCategories(false));
  }, [locale]);

  useEffect(() => {
    if (!effectiveCategoryId) {
      setCategoryFilters([]);
      return;
    }

    api
      .get<{ data: CategoryFilter[] }>(`/categories/${effectiveCategoryId}/filters`, {
        params: { locale, includeAncestors: true }
      })
      .then((response) => setCategoryFilters(response.data.data))
      .catch(() => setCategoryFilters([]));
  }, [effectiveCategoryId, locale]);

  useEffect(() => {
    setSelectedSubcategoryPath([]);
    setSelectedFilterOptionIds([]);
  }, [activeCategory?.id]);

  useEffect(() => {
    if (isCategoryPage) return;
    setSelectedSubcategoryPath([]);
    setSelectedFilterOptionIds([]);
  }, [appliedCategoryId, isCategoryPage]);

  useEffect(() => {
    setAppliedSearch(urlSearch);
    setPage(1);

    const urlMin = searchParams.get('minPrice');
    const urlMax = searchParams.get('maxPrice');
    const urlMinYear = searchParams.get('minModelYear');
    const urlMaxYear = searchParams.get('maxModelYear');
    const urlCity = (searchParams.get('city') ?? '').trim();
    const urlWilayah = (searchParams.get('wilayah') ?? '').trim();

    if (urlMin && !Number.isNaN(Number(urlMin))) {
      const min = Number(urlMin);
      setMinPrice(min);
      setAppliedMinPrice(String(min));
    }

    if (urlMax && !Number.isNaN(Number(urlMax))) {
      const max = Number(urlMax);
      setMaxPrice(max);
      setAppliedMaxPrice(String(max));
    }

    if (urlMinYear && !Number.isNaN(Number(urlMinYear))) {
      const minYear = Number(urlMinYear);
      setMinModelYear(minYear);
      setAppliedMinModelYear(String(minYear));
    }

    if (urlMaxYear && !Number.isNaN(Number(urlMaxYear))) {
      const maxYear = Number(urlMaxYear);
      setMaxModelYear(maxYear);
      setAppliedMaxModelYear(String(maxYear));
    }

    setCity(urlCity);
    setAppliedCity(urlCity);
    setWilayah(urlWilayah);
    setAppliedWilayah(urlWilayah);
  }, [urlSearch, searchParams]);

  useEffect(() => {
    setSelectedFilterOptionIds([]);
  }, [selectedSubcategoryPath]);

  useEffect(() => {
    if (decodedCategorySlug && categories.length === 0) {
      setIsLoading(true);
      return;
    }

    if (decodedCategorySlug && !activeCategory) {
      setListings([]);
      setTotal(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    api
      .get<{ data: ListingsResponse }>('/ads/all', {
        params: {
          page,
          limit: 12,
          q: appliedSearch || undefined,
          categoryId: effectiveCategoryId || undefined,
          city: appliedCity || undefined,
          wilayah: appliedCity && appliedWilayah ? appliedWilayah : undefined,
          minPrice: appliedMinPrice || undefined,
          maxPrice: appliedMaxPrice || undefined,
          minModelYear: appliedMinModelYear || undefined,
          maxModelYear: appliedMaxModelYear || undefined,
          filterOptionIds: selectedFilterOptionIds.length > 0 ? selectedFilterOptionIds.join(',') : undefined
        }
      })
      .then((response) => {
        setListings((current) => (page === 1 ? response.data.data.items : [...current, ...response.data.data.items]));
        setTotal(response.data.data.total);
      })
      .catch(() => {
        setListings([]);
        setTotal(0);
      })
      .finally(() => setIsLoading(false));
  }, [appliedCity, appliedWilayah, appliedMaxModelYear, appliedMaxPrice, appliedMinModelYear, appliedMinPrice, appliedSearch, decodedCategorySlug, effectiveCategoryId, page, categories.length, selectedFilterOptionIds]);

  useEffect(() => {
    const token = getUserAccessToken();
    if (!token || listings.length === 0) return;

    api
      .get<{ data: string[] }>('/ads/favorites/ids', { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => setFavoriteIds(new Set(response.data.data)))
      .catch(() => setFavoriteIds(new Set()));
  }, [listings.length]);

  const displayedListings = useMemo(() => {
    return [...listings].sort((a, b) => {
      if (sort === 'price-low') return Number(a.price ?? 0) - Number(b.price ?? 0);
      if (sort === 'price-high') return Number(b.price ?? 0) - Number(a.price ?? 0);
      if (sort === 'popular') return (b.views ?? 0) - (a.views ?? 0);
      return 0;
    });
  }, [listings, sort]);

  const shownTotal = total;
  const hasMore = listings.length > 0 && listings.length < total;
  const activePriceCeiling = priceScale;
  const minPercent = (minPrice / activePriceCeiling) * 100;
  const maxPercent = (maxPrice / activePriceCeiling) * 100;
  const minYearPercent = ((minModelYear - modelYearFloor) / (modelYearCeiling - modelYearFloor)) * 100;
  const maxYearPercent = ((maxModelYear - modelYearFloor) / (modelYearCeiling - modelYearFloor)) * 100;
  const pageMessages = listingsPageMessages[locale];
  const sortOptions = [
    { value: 'recent', label: pageMessages.recent },
    { value: 'price-low', label: pageMessages.priceLow },
    { value: 'price-high', label: pageMessages.priceHigh },
    { value: 'popular', label: pageMessages.popular }
  ];
  const wilayahOptions = city ? getWilayahsForGovernorate(city) : [];

  const resetFilters = () => {
    setSelectedSubcategoryPath([]);
    setSelectedCategoryId('');
    setAppliedCategoryId('');
    setCity('');
    setWilayah('');
    setAppliedCity('');
    setAppliedWilayah('');
    setMinPrice(priceFloor);
    setMaxPrice(defaultPriceScale);
    setPriceScale(defaultPriceScale);
    setAppliedMinPrice('');
    setAppliedMaxPrice('');
    setMinModelYear(modelYearFloor);
    setMaxModelYear(modelYearCeiling);
    setAppliedMinModelYear('');
    setAppliedMaxModelYear('');
    setSelectedFilterOptionIds([]);
    setPage(1);

    if (isCategoryPage && decodedCategorySlug) {
      router.push(localizedPath(`/category/${decodedCategorySlug}`));
    } else {
      router.push(localizedPath('/all-listings'));
    }
  };

  const selectRootCategory = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setAppliedCategoryId(categoryId);
    setSelectedSubcategoryPath([]);
    setSelectedFilterOptionIds([]);
    setPage(1);
  };

  const clearRootCategory = () => {
    setSelectedCategoryId('');
    setAppliedCategoryId('');
    setSelectedSubcategoryPath([]);
    setSelectedFilterOptionIds([]);
    setPage(1);
  };

  const applyFilters = () => {
    if (!isCategoryPage && selectedCategoryId) {
      setAppliedCategoryId(selectedCategoryId);
    }
    setAppliedCity(city);
    setAppliedWilayah(city && wilayah ? wilayah : '');
    setAppliedMinPrice(minPrice > priceFloor ? String(minPrice) : '');
    setAppliedMaxPrice(maxPrice < activePriceCeiling ? String(maxPrice) : '');
    setAppliedMinModelYear(minModelYear > modelYearFloor ? String(minModelYear) : '');
    setAppliedMaxModelYear(maxModelYear < modelYearCeiling ? String(maxModelYear) : '');
    setPage(1);
  };

  const selectPriceScale = (ceiling: number) => {
    setPriceScale(ceiling);
    setMinPrice((current) => Math.min(current, ceiling));
    setMaxPrice((current) => Math.min(current, ceiling));
  };

  const formatPriceScaleLabel = (value: number) => {
    if (value >= priceCeiling) return pageMessages.all;
    return locale === 'ar' ? `${value.toLocaleString('en-US')}+ ر.ع` : `${value.toLocaleString('en-US')}+ OMR`;
  };

  const handleSubcategorySelect = (levelIndex: number, categoryId: string) => {
    setSelectedSubcategoryPath((current) => updateSubcategoryPath(current, levelIndex, categoryId));
    setPage(1);
  };

  const toggleFilterOption = (filter: CategoryFilter, optionId: string) => {
    setSelectedFilterOptionIds((current) =>
      selectFilterOption(
        current,
        filter.options.map((option) => option.id),
        optionId
      )
    );
    setPage(1);
  };

  const updateMinModelYear = (value: number) => {
    setMinModelYear(Math.min(value, maxModelYear - 1));
  };

  const updateMaxModelYear = (value: number) => {
    setMaxModelYear(Math.max(value, minModelYear + 1));
  };

  const updateMinPrice = (value: number) => {
    setMinPrice(Math.min(value, maxPrice - priceStep));
  };

  const updateMaxPrice = (value: number) => {
    setMaxPrice(Math.max(value, minPrice + priceStep));
  };

  const listingsGrid = isLoading && listings.length === 0 ? (
    <ListingCardsSkeleton count={isCategoryPage ? 6 : 8} />
  ) : displayedListings.length === 0 ? (
    <div className="rounded-xl bg-white p-8 text-center font-bold text-gray-500 shadow-sm">{pageMessages.empty}</div>
  ) : (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      {displayedListings.map((listing) => (
        <ListingCard
          key={listing.id}
          listing={listing}
          isFavorited={favoriteIds.has(listing.id)}
          onFavoriteChange={(favorited) => {
            setFavoriteIds((current) => {
              const next = new Set(current);
              if (favorited) next.add(listing.id);
              else next.delete(listing.id);
              return next;
            });
          }}
        />
      ))}
    </div>
  );

  const sortBar = (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-lg bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">{pageMessages.sortBy}</span>
        <Dropdown value={sort} options={sortOptions} onChange={setSort} />
      </div>
    </div>
  );

  const modelYearSlider = (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm font-bold text-gray-700">
        <span>{pageMessages.modelYearRange}</span>
        <span dir="ltr">
          {minModelYear} - {maxModelYear}
        </span>
      </div>
      <div className="relative h-10">
        <div className="absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-gray-200" />
        <div
          className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-green-500"
          style={
            dir === 'rtl'
              ? { right: `${minYearPercent}%`, left: `${100 - maxYearPercent}%` }
              : { left: `${minYearPercent}%`, right: `${100 - maxYearPercent}%` }
          }
        />
        <input
          type="range"
          min={modelYearFloor}
          max={modelYearCeiling}
          step={1}
          value={minModelYear}
          onChange={(event) => updateMinModelYear(Number(event.target.value))}
          className="pointer-events-none absolute inset-x-0 top-1/2 w-full -translate-y-1/2 appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-green-600 [&::-webkit-slider-thumb]:shadow"
        />
        <input
          type="range"
          min={modelYearFloor}
          max={modelYearCeiling}
          step={1}
          value={maxModelYear}
          onChange={(event) => updateMaxModelYear(Number(event.target.value))}
          className="pointer-events-none absolute inset-x-0 top-1/2 w-full -translate-y-1/2 appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-green-700 [&::-webkit-slider-thumb]:shadow"
        />
      </div>
    </div>
  );

  const priceSlider = (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm font-bold text-gray-700">
        <span>{pageMessages.priceRange}</span>
        <span dir="ltr">
          {minPrice.toLocaleString('en-US')} - {maxPrice.toLocaleString('en-US')} OMR
        </span>
      </div>
      <div className="mb-3">
        <p className="mb-2 text-xs font-bold text-gray-500">{pageMessages.priceScale}</p>
        <div className="flex flex-wrap gap-1.5">
          {priceScalePresets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => selectPriceScale(preset)}
              className={`rounded-full border px-2.5 py-1 text-xs font-bold transition ${
                priceScale === preset
                  ? 'border-green-600 bg-green-50 text-green-700'
                  : 'border-gray-300 bg-white text-gray-600 hover:border-green-500'
              }`}
            >
              {formatPriceScaleLabel(preset)}
            </button>
          ))}
        </div>
      </div>
      <div className="relative h-10">
        <div className="absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-gray-200" />
        <div
          className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-green-500"
          style={
            dir === 'rtl'
              ? { right: `${minPercent}%`, left: `${100 - maxPercent}%` }
              : { left: `${minPercent}%`, right: `${100 - maxPercent}%` }
          }
        />
        <input
          type="range"
          min={priceFloor}
          max={activePriceCeiling}
          step={priceStep}
          value={minPrice}
          onChange={(event) => updateMinPrice(Number(event.target.value))}
          className="pointer-events-none absolute inset-x-0 top-1/2 w-full -translate-y-1/2 appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-green-600 [&::-webkit-slider-thumb]:shadow"
        />
        <input
          type="range"
          min={priceFloor}
          max={activePriceCeiling}
          step={priceStep}
          value={maxPrice}
          onChange={(event) => updateMaxPrice(Number(event.target.value))}
          className="pointer-events-none absolute inset-x-0 top-1/2 w-full -translate-y-1/2 appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-green-700 [&::-webkit-slider-thumb]:shadow"
        />
      </div>
    </div>
  );

  const subcategoryChipRows = (levels: typeof subcategoryLevels) =>
    levels.map((level) => (
      <div
        key={`${level.parentId}-${level.levelIndex}`}
        className="filter-chips-shell -mx-4 mb-4 px-4 sm:mx-0 sm:px-0"
      >
        <div className="filter-chips-scroll flex gap-2 overflow-x-auto pb-2">
          <span className="shrink-0 self-center text-sm font-bold text-gray-500">{level.title}:</span>
          <button
            onClick={() => handleSubcategorySelect(level.levelIndex, '')}
            className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 transition ${!level.selectedId ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {pageMessages.all}
          </button>
          {level.options.map((category) => (
            <button
              key={category.id}
              onClick={() =>
                handleSubcategorySelect(level.levelIndex, level.selectedId === category.id ? '' : category.id)
              }
              className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 transition ${level.selectedId === category.id ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>
    ));

  const secondaryFilterContent = (
    <>
      {categoryFilters.map((filter) => (
        <FilterSection key={filter.id} title={filter.title}>
          {filter.options.map((option) => (
            <FilterChip
              key={option.id}
              active={selectedFilterOptionIds.includes(option.id)}
              onClick={() => toggleFilterOption(filter, option.id)}
            >
              {option.label}
            </FilterChip>
          ))}
        </FilterSection>
      ))}

      {isPassengerCarsCategory ? (
        <FilterSection title={pageMessages.modelYearRange}>{modelYearSlider}</FilterSection>
      ) : null}

      <FilterSection title={pageMessages.selectCity}>
        <FilterChip
          active={!city}
          onClick={() => {
            setCity('');
            setWilayah('');
          }}
        >
          {pageMessages.all}
        </FilterChip>
        {omanGovernorates.map((governorate) => (
          <FilterChip
            key={governorate.value}
            active={city === governorate.value}
            onClick={() => {
              if (city === governorate.value) {
                setCity('');
                setWilayah('');
              } else {
                setCity(governorate.value);
                setWilayah('');
              }
            }}
          >
            {locale === 'en' ? governorate.en : governorate.ar}
          </FilterChip>
        ))}
      </FilterSection>

      {city && wilayahOptions.length > 0 ? (
        <FilterSection title={pageMessages.selectWilayah}>
          <FilterChip active={!wilayah} onClick={() => setWilayah('')}>
            {pageMessages.allWilayahsInGovernorate}
          </FilterChip>
          {wilayahOptions.map((wilayahOption) => (
            <FilterChip
              key={wilayahOption.value}
              active={wilayah === wilayahOption.value}
              onClick={() => setWilayah(wilayah === wilayahOption.value ? '' : wilayahOption.value)}
            >
              {locale === 'en' ? wilayahOption.en : wilayahOption.ar}
            </FilterChip>
          ))}
        </FilterSection>
      ) : null}

      <FilterSection title={pageMessages.priceRange}>{priceSlider}</FilterSection>

      <div className="flex gap-2 pt-2">
        <button
          onClick={applyFilters}
          className="flex-1 rounded-lg bg-green-600 px-4 py-2 font-bold text-white transition hover:bg-green-700"
        >
          {pageMessages.applyFilters}
        </button>
        <button
          onClick={resetFilters}
          className="rounded-lg border border-gray-300 px-4 py-2 transition hover:bg-gray-50"
        >
          {pageMessages.resetFilters}
        </button>
      </div>
    </>
  );

  const desktopSubcategoryFilters = subcategoryLevels.map((level) => (
    <FilterSection key={`${level.parentId}-${level.levelIndex}`} title={level.title}>
      <FilterChip active={!level.selectedId} onClick={() => handleSubcategorySelect(level.levelIndex, '')}>
        {pageMessages.all}
      </FilterChip>
      {level.options.map((category) => (
        <FilterChip
          key={category.id}
          active={level.selectedId === category.id}
          onClick={() =>
            handleSubcategorySelect(level.levelIndex, level.selectedId === category.id ? '' : category.id)
          }
        >
          {category.name}
        </FilterChip>
      ))}
    </FilterSection>
  ));

  const filterSidebar = (
    <aside className="hidden min-w-0 lg:col-span-1 lg:block">
      <div className="rounded-lg bg-white p-6 shadow-sm lg:sticky" style={{ top: headerOffset || 16 }}>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold">{pageMessages.filters}</h2>
          <button onClick={resetFilters} className="text-sm text-blue-600 hover:underline">
            {pageMessages.clearAll}
          </button>
        </div>
        <div
          className="filter-sidebar-scrollbar space-y-6 overflow-y-auto"
          style={{ maxHeight: headerOffset ? `calc(100vh - ${headerOffset}px - 1rem)` : 'calc(100vh - 12rem)' }}
        >
          {desktopSubcategoryFilters}
          {secondaryFilterContent}
        </div>
      </div>
    </aside>
  );

  const mobileFiltersPanel = (
    <div className="mb-6 lg:hidden">
      <details className="rounded-lg bg-white p-4 shadow-sm">
        <summary className="cursor-pointer text-sm font-bold text-gray-900">{pageMessages.filters}</summary>
        <div className="mt-4 space-y-6">{secondaryFilterContent}</div>
      </details>
    </div>
  );

  return (
    <div className="site-page-shell bg-gray-50" dir={dir}>
      <UserSiteHeader>
        <SiteHeaderSearch />
      </UserSiteHeader>

      <main className="site-container site-page-main min-w-0">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">{activeCategory?.name ?? pageMessages.title}</h1>
          <p className="text-gray-600">
            {shownTotal} {pageMessages.available}
          </p>
        </div>

        {!isCategoryPage ? (
          <>
            <div className="filter-chips-shell -mx-4 mb-4 px-4 sm:mx-0 sm:px-0">
              <div className="filter-chips-scroll flex gap-2 overflow-x-auto pb-2">
                <button
                  onClick={clearRootCategory}
                  className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 transition ${!appliedCategoryId ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  {pageMessages.all}
                </button>
                {isLoadingCategories
                  ? Array.from({ length: 8 }).map((_, index) => (
                      <div
                        key={index}
                        className="h-9 shrink-0 animate-pulse rounded-full bg-slate-200"
                        style={{ width: 72 + (index % 3) * 16 }}
                      />
                    ))
                  : rootCategories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() =>
                          appliedCategoryId === category.id ? clearRootCategory() : selectRootCategory(category.id)
                        }
                        className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 transition ${appliedCategoryId === category.id ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      >
                        {category.name}
                      </button>
                    ))}
              </div>
            </div>

            {subcategoryChipRows(allListingsSubcategoryLevels)}
          </>
        ) : (
          subcategoryChipRows(subcategoryLevels)
        )}

        {mobileFiltersPanel}

        <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-4">
          {filterSidebar}
          <section className="min-w-0 lg:col-span-3">
            {sortBar}
            {listingsGrid}
            <LoadMoreButton
              disabled={!hasMore || isLoading}
              label={pageMessages.loadMore}
              onClick={() => setPage((current) => current + 1)}
            />
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function ListingCard({
  isFavorited,
  listing,
  onFavoriteChange
}: {
  isFavorited: boolean;
  listing: Listing;
  onFavoriteChange: (favorited: boolean) => void;
}) {
  const { locale, localizedPath, m } = useI18n();
  const categoryName =
    (locale === 'en' ? listing.category?.nameEn : listing.category?.nameAr) ?? listing.category?.name ?? '';
  const isFeatured = Boolean(listing.promotion);
  const badgeLabel = listing.promotion?.plan?.badgeLabel ?? m.common.featured;
  const storeName = listing.store ? (locale === 'en' ? listing.store.nameEn : listing.store.nameAr) : null;

  return (
    <Link href={localizedPath(`/listing/${listing.id}`)} className="group block cursor-pointer overflow-hidden rounded-xl bg-white shadow-sm transition-all hover:shadow-lg">
      <div className="relative h-56 overflow-hidden">
        <ListingMediaCover
          items={listing.images}
          alt={listing.title}
          fallbackSrc={fallbackImage}
          className="h-full w-full transition-transform duration-500 group-hover:scale-105"
          imageClassName="h-full w-full"
        />
        <FavoriteButton
          adId={listing.id}
          initialFavorited={isFavorited}
          onChange={onFavoriteChange}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 transition-all hover:scale-110 hover:bg-white"
        />
        {isFeatured ? (
          <span className="absolute left-3 top-3 rounded-md bg-green-500 px-3 py-1 text-xs font-bold text-white">
            {badgeLabel}
          </span>
        ) : null}
        {storeName ? (
          <span className="absolute left-3 top-12 rounded-md bg-slate-900/80 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
            {storeName}
          </span>
        ) : null}
        {categoryName ? (
          <span className="absolute bottom-3 right-3 rounded-md bg-black/60 px-3 py-1 text-xs text-white backdrop-blur-sm">
            {categoryName}
          </span>
        ) : null}
      </div>
      <div className="p-4">
        <ListingTitleWithVerified
          title={listing.title}
          verified={listing.trustBadgeApproved}
          label={m.trustBadge.verifiedLabel}
          titleClassName="line-clamp-1 text-base"
          className="mb-2"
        />
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xl font-bold text-green-600">{formatPrice(listing.price, listing.currency)}</p>
        </div>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <MapPin size={16} className="text-gray-400" />
          <span>{getListingLocationLabel(listing.city, listing.wilayah, listing.area, locale) || '-'}</span>
        </div>
      </div>
    </Link>
  );
}

function FilterSection({ children, title }: { children: ReactNode; title: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button
        className="mb-3 flex w-full items-center justify-between"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <h3 className="text-sm font-bold">{title}</h3>
        <ChevronDown size={18} className={`transition ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen ? <div className="flex flex-wrap gap-2">{children}</div> : null}
    </div>
  );
}

function FilterChip({ active, children, onClick }: { active: boolean; children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm transition ${
        active
          ? 'border-blue-600 bg-blue-50 text-blue-700'
          : 'border-gray-300 bg-white text-gray-700 hover:border-blue-500'
      }`}
    >
      {children}
    </button>
  );
}

function LoadMoreButton({ disabled, label, onClick }: { disabled: boolean; label: string; onClick: () => void }) {
  return (
    <div className="mt-12 text-center">
      <button
        disabled={disabled}
        onClick={onClick}
        className="rounded-lg bg-gray-100 px-8 py-3 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {label}
      </button>
    </div>
  );
}

function Dropdown({
  onChange,
  options,
  value
}: {
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  value: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value) ?? options[0];

  return (
    <div className="relative min-w-44">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 outline-none transition hover:bg-gray-50 focus:ring-2 focus:ring-green-500"
      >
        <span>{selectedOption?.label}</span>
        <ChevronDown size={16} className={`transition ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen ? (
        <div className="absolute z-40 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white py-2 shadow-xl">
          {options.map((option) => (
            <button
              key={option.value || 'empty'}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`block w-full px-4 py-2 text-start text-sm transition hover:bg-green-50 ${
                value === option.value ? 'bg-green-50 font-bold text-green-700' : 'text-gray-700'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function formatPrice(price: string | number | null | undefined, currency: string) {
  if (price === null || price === undefined) return '';
  const numericPrice = Number(price);
  if (!Number.isFinite(numericPrice)) return String(price);
  return `${numericPrice.toLocaleString('en-US')} ${currency === 'OMR' ? 'ر.ع' : currency}`;
}

