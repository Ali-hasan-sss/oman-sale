'use client';

import {
  Baby,
  ArrowUpLeft,
  Bike,
  BookOpen,
  Briefcase,
  Building2,
  Car,
  ChevronDown,
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
import { useEffect, useMemo, useState } from 'react';

import { api } from '@/lib/api';
import { buildCategoryTree, type CategoryTreeNode } from '@/lib/category-tree';
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
  parentId?: string | null;
  icon?: keyof typeof iconMap | string | null;
  _count?: {
    ads: number;
    children?: number;
  };
};

type DisplayCategory = {
  key: string;
  name: string;
  count: string;
  href: string;
  icon: typeof Car;
  color: string;
};

const mapCategoryToDisplay = (category: ApiCategory, index: number): DisplayCategory => {
  const fallback = fallbackCategories[index % fallbackCategories.length]!;
  const Icon = category.icon && category.icon in iconMap ? iconMap[category.icon as keyof typeof iconMap] : fallback.icon;

  return {
    key: category.id,
    name: category.name,
    count: String(category._count?.ads ?? 0),
    href: `/category/${category.slug}`,
    icon: Icon,
    color: fallback.color
  };
};

type CategoryGridCardProps = {
  category: DisplayCategory;
  childrenCategories: DisplayCategory[];
  isExpanded: boolean;
  onToggleChildren: () => void;
  localizedPath: (path: string) => string;
  adCountLabel: string;
  expandLabel: string;
};

function CategoryGridCard({
  category,
  childrenCategories,
  isExpanded,
  onToggleChildren,
  localizedPath,
  adCountLabel,
  expandLabel
}: CategoryGridCardProps) {
  const Icon = category.icon;
  const hasChildren = childrenCategories.length > 0;

  return (
    <div
      className={`${colorClasses[category.color]} flex h-full flex-col overflow-hidden rounded-2xl shadow-sm transition-shadow hover:shadow-lg`}
    >
      <Link
        href={localizedPath(category.href)}
        className="group flex flex-1 flex-col items-center p-6 text-center transition-transform hover:-translate-y-0.5"
      >
        <Icon size={40} strokeWidth={1.5} />
        <h3 className="mt-4 font-bold text-ink-900">{category.name}</h3>
        <p className="mt-1 text-sm text-slate-500">
          {category.count} {adCountLabel}
        </p>
      </Link>

      {hasChildren ? (
        <>
          <button
            type="button"
            onClick={onToggleChildren}
            aria-expanded={isExpanded}
            aria-label={expandLabel}
            className="flex w-full items-center justify-center border-t border-black/5 py-2 text-current transition hover:bg-black/5"
          >
            <ChevronDown size={20} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
          </button>

          {isExpanded ? (
            <div className="space-y-1.5 border-t border-black/5 px-3 pb-3 pt-2">
              {childrenCategories.map((child) => (
                <Link
                  key={child.key}
                  href={localizedPath(child.href)}
                  className="block rounded-xl bg-white/70 px-3 py-2 text-sm font-bold text-ink-900 transition hover:bg-white"
                >
                  <span className="line-clamp-1">{child.name}</span>
                  <span className="mt-0.5 block text-xs font-medium text-slate-500">
                    {child.count} {adCountLabel}
                  </span>
                </Link>
              ))}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

export function CategoriesSection() {
  const { locale, localizedPath, m } = useI18n();
  const [apiCategories, setApiCategories] = useState<ApiCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setIsLoading(true);
    api
      .get<{ data: ApiCategory[] }>('/categories', { params: { locale } })
      .then((response) => setApiCategories(response.data.data))
      .catch(() => setApiCategories([]))
      .finally(() => setIsLoading(false));
  }, [locale]);

  const categoryTree = useMemo(() => buildCategoryTree(apiCategories), [apiCategories]);

  const toggleChildren = (parentId: string) => {
    setExpandedParents((current) => ({ ...current, [parentId]: !current[parentId] }));
  };

  const loadingText = locale === 'ar' ? 'جاري تحميل البيانات...' : 'Loading data...';
  const emptyText = locale === 'ar' ? 'لا توجد فئات متاحة حاليًا' : 'No categories are available right now';
  const expandLabel = locale === 'ar' ? 'عرض الفئات الفرعية' : 'Show subcategories';

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
      ) : categoryTree.length === 0 ? (
        <div className="mb-8 rounded-2xl bg-white p-8 text-center font-bold text-slate-500 shadow-sm">
          {emptyText}
        </div>
      ) : (
        <div className="mb-8 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-6">
          {categoryTree.map((parent: CategoryTreeNode<ApiCategory>, parentIndex) => {
            const parentDisplay = mapCategoryToDisplay(parent, parentIndex);
            const childDisplays = parent.children.map((child, childIndex) =>
              mapCategoryToDisplay(child, parentIndex + childIndex + 1)
            );

            return (
              <CategoryGridCard
                key={parent.id}
                category={parentDisplay}
                childrenCategories={childDisplays}
                isExpanded={Boolean(expandedParents[parent.id])}
                onToggleChildren={() => toggleChildren(parent.id)}
                localizedPath={localizedPath}
                adCountLabel={m.home.adCount}
                expandLabel={expandLabel}
              />
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
