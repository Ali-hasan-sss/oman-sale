'use client';

import { ChevronDown, Filter, Globe, MapPin, Search, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';
import { ReactNode, useEffect, useMemo, useState } from 'react';

import { HeaderAuthAction } from '@/components/auth/user-menu';
import { ChatNavLink } from '@/components/chat/chat-nav-link';
import { SiteFooter } from '@/components/home/site-footer';
import { MobileNavMenu } from '@/components/navigation/mobile-nav-menu';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { getUserAccessToken } from '@/lib/user-auth';
import { FavoriteButton } from './favorite-button';
import { ListingCardsSkeleton } from './listing-card-skeleton';

type Category = {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
};

type Listing = {
  id: string;
  title: string;
  price?: string | number | null;
  currency: string;
  city?: string | null;
  area?: string | null;
  views: number;
  category?: {
    id: string;
    name: string;
    nameAr?: string;
    nameEn?: string;
  };
  images?: Array<{ imageUrl: string }>;
  promotion?: {
    plan?: {
      badgeLabel?: string | null;
      color?: string | null;
    };
  } | null;
};

type ListingsResponse = {
  items: Listing[];
  total: number;
  page: number;
  limit: number;
};

type CategoryFilter = {
  id: string;
  title: string;
  options: Array<{
    id: string;
    label: string;
  }>;
};

const omanCities = [
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
];
const priceFloor = 0;
const priceCeiling = 100000;
const priceStep = 100;

const listingsPageMessages = {
  ar: {
    title: 'جميع الإعلانات',
    available: 'إعلان متاح',
    all: 'الكل',
    filter: 'تصفية',
    filters: 'الفلاتر',
    clearAll: 'مسح الكل',
    subcategories: 'الفئة الفرعية',
    moreFilters: 'المزيد من الخيارات',
    sortBy: 'الترتيب حسب:',
    recent: 'الأحدث',
    priceLow: 'السعر: من الأقل للأعلى',
    priceHigh: 'السعر: من الأعلى للأقل',
    popular: 'الأكثر مشاهدة',
    selectCity: 'اختر المدينة',
    priceRange: 'نطاق السعر',
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
    selectCity: 'Select city',
    priceRange: 'Price range',
    applyFilters: 'Apply filters',
    resetFilters: 'Reset',
    loadMore: 'Load more',
    loading: 'Loading listings...',
    empty: 'No listings match the current filters'
  }
};

const fallbackImage = '/logo.png';

export function AllListingsPage({ categorySlug }: { categorySlug?: string } = {}) {
  const { dir, locale, localizedPath, m, toggleLocale } = useI18n();
  const [categories, setCategories] = useState<Category[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [categoryFilters, setCategoryFilters] = useState<CategoryFilter[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedFilterOptionIds, setSelectedFilterOptionIds] = useState<string[]>([]);
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedCategoryId, setAppliedCategoryId] = useState('');
  const [appliedCity, setAppliedCity] = useState('');
  const [appliedMinPrice, setAppliedMinPrice] = useState('');
  const [appliedMaxPrice, setAppliedMaxPrice] = useState('');
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [minPrice, setMinPrice] = useState(priceFloor);
  const [maxPrice, setMaxPrice] = useState(priceCeiling);
  const [sort, setSort] = useState('recent');
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const decodedCategorySlug = categorySlug ? decodeURIComponent(categorySlug) : undefined;
  const activeCategory = decodedCategorySlug
    ? categories.find((category) => category.slug === decodedCategorySlug)
    : undefined;
  const isCategoryPage = Boolean(decodedCategorySlug);
  const subcategories = activeCategory ? categories.filter((category) => category.parentId === activeCategory.id) : [];
  const effectiveCategoryId = isCategoryPage ? selectedCategoryId || activeCategory?.id : appliedCategoryId;

  useEffect(() => {
    api
      .get<{ data: Category[] }>('/categories', { params: { locale } })
      .then((response) => setCategories(response.data.data))
      .catch(() => setCategories([]));
  }, [locale]);

  useEffect(() => {
    if (!activeCategory) {
      setCategoryFilters([]);
      return;
    }

    api
      .get<{ data: CategoryFilter[] }>(`/categories/${activeCategory.id}/filters`, { params: { locale } })
      .then((response) => setCategoryFilters(response.data.data))
      .catch(() => setCategoryFilters([]));
  }, [activeCategory, locale]);

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
          minPrice: appliedMinPrice || undefined,
          maxPrice: appliedMaxPrice || undefined,
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
  }, [appliedCity, appliedMaxPrice, appliedMinPrice, appliedSearch, decodedCategorySlug, effectiveCategoryId, page, categories.length, selectedFilterOptionIds]);

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
  const minPercent = (minPrice / priceCeiling) * 100;
  const maxPercent = (maxPrice / priceCeiling) * 100;
  const pageMessages = listingsPageMessages[locale];
  const sortOptions = [
    { value: 'recent', label: pageMessages.recent },
    { value: 'price-low', label: pageMessages.priceLow },
    { value: 'price-high', label: pageMessages.priceHigh },
    { value: 'popular', label: pageMessages.popular }
  ];
  const cityOptions = [
    { value: '', label: pageMessages.selectCity },
    ...omanCities.map((cityOption) => ({
      value: cityOption.value,
      label: locale === 'en' ? cityOption.en : cityOption.ar
    }))
  ];

  const resetFilters = () => {
    setSelectedCategoryId('');
    setAppliedCategoryId('');
    setCity('');
    setAppliedCity('');
    setMinPrice(priceFloor);
    setMaxPrice(priceCeiling);
    setAppliedMinPrice('');
    setAppliedMaxPrice('');
    setSearch('');
    setAppliedSearch('');
    setSelectedFilterOptionIds([]);
    setPage(1);
  };

  const applyFilters = () => {
    setAppliedSearch(search);
    setAppliedCategoryId(selectedCategoryId);
    setAppliedCity(city);
    setAppliedMinPrice(minPrice > priceFloor ? String(minPrice) : '');
    setAppliedMaxPrice(maxPrice < priceCeiling ? String(maxPrice) : '');
    setPage(1);
  };

  const toggleFilterOption = (optionId: string) => {
    setSelectedFilterOptionIds((current) =>
      current.includes(optionId) ? current.filter((id) => id !== optionId) : [...current, optionId]
    );
    setPage(1);
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
    <div className={`grid grid-cols-1 gap-6 md:grid-cols-2 ${isCategoryPage ? 'lg:grid-cols-3' : 'lg:grid-cols-4'}`}>
      {displayedListings.map((listing) => (
        <ListingCard
          key={listing.id}
          listing={listing}
          image={listing.images?.[0]?.imageUrl}
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

  const priceSlider = (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm font-bold text-gray-700">
        <span>{pageMessages.priceRange}</span>
        <span dir="ltr">
          {minPrice.toLocaleString('en-US')} - {maxPrice.toLocaleString('en-US')} OMR
        </span>
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
          max={priceCeiling}
          step={priceStep}
          value={minPrice}
          onChange={(event) => updateMinPrice(Number(event.target.value))}
          className="pointer-events-none absolute inset-x-0 top-1/2 w-full -translate-y-1/2 appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-green-600 [&::-webkit-slider-thumb]:shadow"
        />
        <input
          type="range"
          min={priceFloor}
          max={priceCeiling}
          step={priceStep}
          value={maxPrice}
          onChange={(event) => updateMaxPrice(Number(event.target.value))}
          className="pointer-events-none absolute inset-x-0 top-1/2 w-full -translate-y-1/2 appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-green-700 [&::-webkit-slider-thumb]:shadow"
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50" dir={dir}>
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="mb-4 flex items-center justify-between gap-4">
            <Link href={localizedPath('/')} className="flex items-center gap-3">
              <img src="/logo.png" alt="Oman Sale" className="h-14 w-auto" />
            </Link>
            <MobileNavMenu />
            <div className="hidden items-center gap-4 lg:flex">
              <button onClick={toggleLocale} className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 transition hover:bg-gray-50">
                <Globe size={18} />
                <span className="text-sm">{m.common.languageSwitch}</span>
              </button>
              <ChatNavLink className="rounded-lg border border-gray-300 px-4 py-2 transition hover:bg-gray-50" />
              <HeaderLink href="/all-listings" label={m.common.allListings} />
              <HeaderLink href="/my-listings" label={m.common.myListings} />
              <Link href={localizedPath('/add-listing')} className="rounded-lg bg-green-600 px-4 py-2 text-white transition hover:bg-green-700">
                {m.common.addListing}
              </Link>
              <HeaderAuthAction loginClassName="rounded-lg border border-gray-300 px-4 py-2 transition hover:bg-gray-50" />
            </div>
          </div>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
              }}
              type="text"
              placeholder={m.home.searchPlaceholder}
              className="w-full rounded-lg border border-gray-300 py-3 pl-4 pr-12 outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">{activeCategory?.name ?? pageMessages.title}</h1>
          <p className="text-gray-600">
            {shownTotal} {pageMessages.available}
          </p>
        </div>

        {isCategoryPage ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            <aside className="lg:col-span-1">
              <div className="sticky top-4 rounded-lg bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-lg font-bold">{pageMessages.filters}</h2>
                  <button onClick={resetFilters} className="text-sm text-blue-600 hover:underline">
                    {pageMessages.clearAll}
                  </button>
                </div>
                <div className="filter-sidebar-scrollbar max-h-[calc(100vh-200px)] space-y-6 overflow-y-auto">
                  {subcategories.length > 0 ? (
                    <FilterSection title={pageMessages.subcategories}>
                      <FilterChip active={!selectedCategoryId} onClick={() => setSelectedCategoryId('')}>
                        {pageMessages.all}
                      </FilterChip>
                      {subcategories.map((category) => (
                        <FilterChip
                          key={category.id}
                          active={selectedCategoryId === category.id}
                          onClick={() => setSelectedCategoryId(category.id)}
                        >
                          {category.name}
                        </FilterChip>
                      ))}
                    </FilterSection>
                  ) : null}

                  {categoryFilters.map((filter) => (
                    <FilterSection key={filter.id} title={filter.title}>
                      {filter.options.map((option) => (
                        <FilterChip
                          key={option.id}
                          active={selectedFilterOptionIds.includes(option.id)}
                          onClick={() => toggleFilterOption(option.id)}
                        >
                          {option.label}
                        </FilterChip>
                      ))}
                    </FilterSection>
                  ))}

                  <FilterSection title={pageMessages.selectCity}>
                    {omanCities.map((cityOption) => (
                      <FilterChip
                        key={cityOption.value}
                        active={city === cityOption.value}
                        onClick={() => setCity(city === cityOption.value ? '' : cityOption.value)}
                      >
                        {locale === 'en' ? cityOption.en : cityOption.ar}
                      </FilterChip>
                    ))}
                  </FilterSection>

                  <FilterSection title={pageMessages.priceRange}>{priceSlider}</FilterSection>

                  <div className="flex gap-2 pt-2">
                    <button onClick={applyFilters} className="flex-1 rounded-lg bg-green-600 px-4 py-2 font-bold text-white transition hover:bg-green-700">
                      {pageMessages.applyFilters}
                    </button>
                    <button onClick={resetFilters} className="rounded-lg border border-gray-300 px-4 py-2 transition hover:bg-gray-50">
                      {pageMessages.resetFilters}
                    </button>
                  </div>
                </div>
              </div>
            </aside>

            <section className="lg:col-span-3">
              {sortBar}
              {listingsGrid}
              <LoadMoreButton disabled={!hasMore || isLoading} label={pageMessages.loadMore} onClick={() => setPage((current) => current + 1)} />
            </section>
          </div>
        ) : (
          <>
            <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => {
                  setSelectedCategoryId('');
                }}
                className={`whitespace-nowrap rounded-full px-4 py-2 transition ${!selectedCategoryId ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {pageMessages.all}
              </button>
              {categories.slice(0, 10).map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    setSelectedCategoryId(category.id);
                  }}
                  className={`whitespace-nowrap rounded-full px-4 py-2 transition ${selectedCategoryId === category.id ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  {category.name}
                </button>
              ))}
            </div>

            <div className="mb-8 rounded-lg bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 transition hover:bg-gray-50">
                    <Filter size={20} />
                    <span>{pageMessages.filter}</span>
                  </button>
                  <button
                    onClick={() => setShowMoreFilters((current) => !current)}
                    className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 transition hover:bg-gray-50"
                  >
                    <SlidersHorizontal size={20} />
                    <span>{pageMessages.moreFilters}</span>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{pageMessages.sortBy}</span>
                  <Dropdown value={sort} options={sortOptions} onChange={setSort} />
                </div>
              </div>

              {showMoreFilters ? (
                <div className="mt-4 grid gap-4 border-t border-gray-100 pt-4 md:grid-cols-4">
                  <Dropdown value={city} options={cityOptions} onChange={setCity} />
                  <div className="md:col-span-2">{priceSlider}</div>
                  <div className="flex gap-2">
                    <button onClick={applyFilters} className="flex-1 rounded-lg bg-green-600 px-4 py-2 font-bold text-white transition hover:bg-green-700">
                      {pageMessages.applyFilters}
                    </button>
                    <button onClick={resetFilters} className="rounded-lg border border-gray-300 px-4 py-2 transition hover:bg-gray-50">
                      {pageMessages.resetFilters}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            {listingsGrid}
            <LoadMoreButton disabled={!hasMore || isLoading} label={pageMessages.loadMore} onClick={() => setPage((current) => current + 1)} />
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );

  function HeaderLink({ href, label }: { href: string; label: string }) {
    return (
      <Link href={localizedPath(href)} className="rounded-lg border border-gray-300 px-4 py-2 transition hover:bg-gray-50">
        {label}
      </Link>
    );
  }
}

function ListingCard({
  image,
  isFavorited,
  listing,
  onFavoriteChange
}: {
  image?: string;
  isFavorited: boolean;
  listing: Listing;
  onFavoriteChange: (favorited: boolean) => void;
}) {
  const { locale, localizedPath, m } = useI18n();
  const categoryName =
    (locale === 'en' ? listing.category?.nameEn : listing.category?.nameAr) ?? listing.category?.name ?? '';
  const isFeatured = Boolean(listing.promotion);
  const badgeLabel = listing.promotion?.plan?.badgeLabel ?? m.common.featured;

  return (
    <Link href={localizedPath(`/listing/${listing.id}`)} className="group block cursor-pointer overflow-hidden rounded-xl bg-white shadow-sm transition-all hover:shadow-lg">
      <div className="relative h-56 overflow-hidden">
        <img
          src={image ?? fallbackImage}
          alt={listing.title}
          className={`h-full w-full transition-transform duration-500 group-hover:scale-105 ${image ? 'object-cover' : 'object-contain p-8'}`}
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
        {categoryName ? (
          <span className="absolute bottom-3 right-3 rounded-md bg-black/60 px-3 py-1 text-xs text-white backdrop-blur-sm">
            {categoryName}
          </span>
        ) : null}
      </div>
      <div className="p-4">
        <h3 className="mb-2 line-clamp-1 text-base font-bold text-gray-900">{listing.title}</h3>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xl font-bold text-green-600">{formatPrice(listing.price, listing.currency)}</p>
        </div>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <MapPin size={16} className="text-gray-400" />
          <span>{listing.area || listing.city || '-'}</span>
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

