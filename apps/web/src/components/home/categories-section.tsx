'use client';

import {
  Baby,
  ArrowUpLeft,
  Bike,
  BookOpen,
  Briefcase,
  Building2,
  Car,
  Gamepad2,
  GraduationCap,
  Heart,
  Home,
  Laptop,
  MapPin,
  Monitor,
  Palette,
  Search,
  Shirt,
  Smartphone,
  Sofa,
  Store,
  Stethoscope,
  Tag,
  Truck,
  Utensils,
  Watch,
  Wrench
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

const fallbackCategories = [
  { count: '3456', href: '/fashion', icon: Shirt, color: 'yellow' },
  { count: '892', href: '/stores', icon: Store, color: 'pink' },
  { count: '2456', href: '/cars', icon: Car, color: 'blue' },
  { count: '234', href: '/bikes', icon: Bike, color: 'green' },
  { count: '1245', href: '/real-estate-sale', icon: Building2, color: 'indigo' },
  { count: '578', href: '/real-estate-rent', icon: Home, color: 'emerald' },
  { count: '1567', href: '/home-garden', icon: Sofa, color: 'teal' },
  { count: '756', href: '/services', icon: Wrench, color: 'red' },
  { count: '445', href: '/business-equipment', icon: Building2, color: 'slate' },
  { count: '567', href: '/animals', icon: Baby, color: 'orange' },
  { count: '2890', href: '/mobile-tablet', icon: Smartphone, color: 'purple' },
  { count: '1234', href: '/games', icon: Gamepad2, color: 'cyan' },
  { count: '3210', href: '/electronics', icon: Monitor, color: 'blue' },
  { count: '892', href: '/home-appliances', icon: Sofa, color: 'rose' },
  { count: '678', href: '/books-sports', icon: BookOpen, color: 'amber' },
  { count: '945', href: '/jobs', icon: Briefcase, color: 'violet' },
  { count: '423', href: '/job-seekers', icon: Search, color: 'fuchsia' },
  { count: '334', href: '/training', icon: GraduationCap, color: 'lime' }
];

const colorClasses: Record<string, string> = {
  yellow: 'bg-yellow-50 text-yellow-600',
  pink: 'bg-pink-50 text-pink-600',
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  indigo: 'bg-indigo-50 text-indigo-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  teal: 'bg-teal-50 text-teal-600',
  red: 'bg-red-50 text-red-600',
  slate: 'bg-slate-50 text-slate-600',
  orange: 'bg-orange-50 text-orange-600',
  purple: 'bg-purple-50 text-purple-600',
  cyan: 'bg-cyan-50 text-cyan-600',
  rose: 'bg-rose-50 text-rose-600',
  amber: 'bg-amber-50 text-amber-600',
  violet: 'bg-violet-50 text-violet-600',
  fuchsia: 'bg-fuchsia-50 text-fuchsia-600',
  lime: 'bg-lime-50 text-lime-600'
};

const iconMap = {
  baby: Baby,
  bike: Bike,
  book: BookOpen,
  briefcase: Briefcase,
  building: Building2,
  car: Car,
  gamepad: Gamepad2,
  graduation: GraduationCap,
  heart: Heart,
  home: Home,
  laptop: Laptop,
  'map-pin': MapPin,
  monitor: Monitor,
  palette: Palette,
  search: Search,
  shirt: Shirt,
  smartphone: Smartphone,
  sofa: Sofa,
  store: Store,
  stethoscope: Stethoscope,
  tag: Tag,
  truck: Truck,
  utensils: Utensils,
  watch: Watch,
  wrench: Wrench
};

type ApiCategory = {
  id: string;
  name: string;
  slug: string;
  icon?: keyof typeof iconMap | string | null;
  _count?: {
    ads: number;
  };
};

export function CategoriesSection() {
  const { locale, localizedPath, m } = useI18n();
  const [apiCategories, setApiCategories] = useState<ApiCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    api
      .get<{ data: ApiCategory[] }>('/categories', { params: { locale } })
      .then((response) => setApiCategories(response.data.data))
      .catch(() => setApiCategories([]))
      .finally(() => setIsLoading(false));
  }, [locale]);

  const categories = apiCategories.map((category, index) => {
    const fallback = fallbackCategories[index] ?? fallbackCategories[0]!;
    const Icon = category.icon && category.icon in iconMap ? iconMap[category.icon as keyof typeof iconMap] : fallback.icon;

    return {
      key: category.id,
      name: category.name,
      count: String(category._count?.ads ?? 0),
      href: `/category/${category.slug}`,
      icon: Icon,
      color: fallback.color
    };
  });
  const loadingText = locale === 'ar' ? 'جاري تحميل البيانات...' : 'Loading data...';
  const emptyText = locale === 'ar' ? 'لا توجد فئات متاحة حاليًا' : 'No categories are available right now';

  return (
    <section className="mb-14">
      <div className="mb-8 text-center">
        <h2 className="mb-2 text-3xl font-black">{m.home.categoriesTitle}</h2>
        <p className="text-slate-600">{m.home.categoriesSubtitle}</p>
      </div>

      {isLoading ? (
        <div className="mb-8 rounded-2xl bg-white p-8 text-center font-bold text-slate-500 shadow-sm">
          {loadingText}
        </div>
      ) : categories.length === 0 ? (
        <div className="mb-8 rounded-2xl bg-white p-8 text-center font-bold text-slate-500 shadow-sm">
          {emptyText}
        </div>
      ) : (
        <div className="mb-8 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-6">
          {categories.map((category) => {
            const Icon = category.icon;

            return (
              <Link
                key={category.key}
                href={localizedPath(category.href)}
                className={`${colorClasses[category.color]} group rounded-2xl p-6 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg`}
              >
                <div className="flex flex-col items-center">
                  <Icon size={40} strokeWidth={1.5} />
                  <h3 className="mt-4 font-bold text-ink-900">{category.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {category.count} {m.home.adCount}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <div className="text-center">
        <Link
          href={localizedPath('/all-listings')}
          className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-8 py-3 font-bold text-white transition hover:bg-brand-700"
        >
          <span>{m.common.allListings}</span>
          <ArrowUpLeft size={18} />
        </Link>
      </div>
    </section>
  );
}
