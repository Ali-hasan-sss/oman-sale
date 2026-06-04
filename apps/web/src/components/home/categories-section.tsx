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
  ChevronLeft,
  ChevronRight,
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
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { api } from '@/lib/api';
import { CategoryIcon, categoryIconMap, isCategoryIconKey } from '@/lib/category-icons';
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
  iconKey: string | null;
  color: string;
};

const mapCategoryToDisplay = (category: ApiCategory, index: number): DisplayCategory => {
  const fallback = fallbackCategories[index % fallbackCategories.length]!;
  const fallbackKey = Object.entries(categoryIconMap).find(([, Icon]) => Icon === fallback.icon)?.[0] ?? 'car';
  const iconKey =
    category.icon && (isCategoryIconKey(category.icon) || /\p{Extended_Pictographic}/u.test(category.icon))
      ? category.icon
      : fallbackKey;

  return {
    key: category.id,
    name: category.name,
    count: String(category._count?.ads ?? 0),
    href: `/category/${category.slug}`,
    iconKey,
    color: fallback.color
  };
};

type CategorySubmenuColumnProps = {
  nodes: CategoryTreeNode<ApiCategory>[];
  localizedPath: (path: string) => string;
  adCountLabel: string;
  mapCategoryToDisplay: (category: ApiCategory, index: number) => DisplayCategory;
  parentIndex: number;
  openPath: string[];
  depth: number;
  dir: 'rtl' | 'ltr';
  onToggleSubmenu: (depth: number, nodeId: string) => void;
  onNavigate: () => void;
};

function getColumnParentIndex(
  parentIndex: number,
  columns: CategoryTreeNode<ApiCategory>[][],
  openPath: string[],
  depth: number
): number {
  let index = parentIndex;

  for (let level = 0; level < depth; level += 1) {
    const selectedIndex = columns[level]!.findIndex((node) => node.id === openPath[level]);
    if (selectedIndex >= 0) {
      index += selectedIndex + 1;
    }
  }

  return index;
}

function getSubmenuColumns(
  rootNodes: CategoryTreeNode<ApiCategory>[],
  openPath: string[]
): CategoryTreeNode<ApiCategory>[][] {
  const columns: CategoryTreeNode<ApiCategory>[][] = [rootNodes];
  let currentNodes = rootNodes;

  for (const nodeId of openPath) {
    const selected = currentNodes.find((node) => node.id === nodeId);
    if (!selected || selected.children.length === 0) break;
    columns.push(selected.children);
    currentNodes = selected.children;
  }

  return columns;
}

function CategorySubmenuColumn({
  nodes,
  localizedPath,
  adCountLabel,
  mapCategoryToDisplay,
  parentIndex,
  openPath,
  depth,
  dir,
  onToggleSubmenu,
  onNavigate
}: CategorySubmenuColumnProps) {
  const SubmenuArrow = dir === 'rtl' ? ChevronLeft : ChevronRight;

  return (
    <div className="w-max min-w-[240px] shrink-0 rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
      {nodes.map((node, index) => {
        const display = mapCategoryToDisplay(node, parentIndex + index + 1);
        const hasChildren = node.children.length > 0;
        const isSubmenuOpen = openPath[depth] === node.id;

        return (
          <div
            key={node.id}
            className={`flex items-center gap-1 px-1 ${isSubmenuOpen ? 'bg-brand-50' : ''}`}
          >
            <Link
              href={localizedPath(display.href)}
              onClick={onNavigate}
              className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-2 text-sm font-bold text-ink-900 transition hover:bg-slate-50"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-brand-600">
                <CategoryIcon icon={display.iconKey} size={18} />
              </span>
              <span className="min-w-0 flex-1 text-start">
                <span>{display.name}</span>
                <span className="mt-0.5 block text-xs font-medium text-slate-500">
                  {display.count} {adCountLabel}
                </span>
              </span>
            </Link>
            {hasChildren ? (
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onToggleSubmenu(depth, node.id);
                }}
                aria-expanded={isSubmenuOpen}
                aria-label={display.name}
                className={`shrink-0 rounded-lg p-2 transition hover:bg-slate-100 ${isSubmenuOpen ? 'bg-brand-100 text-brand-700' : 'text-slate-500'}`}
              >
                <SubmenuArrow size={16} />
              </button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

type CategoryTreeMenuProps = {
  nodes: CategoryTreeNode<ApiCategory>[];
  localizedPath: (path: string) => string;
  adCountLabel: string;
  mapCategoryToDisplay: (category: ApiCategory, index: number) => DisplayCategory;
  parentIndex: number;
  openPath: string[];
  dir: 'rtl' | 'ltr';
  onToggleSubmenu: (depth: number, nodeId: string) => void;
  onNavigate: () => void;
  menuRef: React.Ref<HTMLDivElement>;
  menuPosition: { top: number; left: number } | null;
};

function CategoryTreeMenu({
  nodes,
  localizedPath,
  adCountLabel,
  mapCategoryToDisplay,
  parentIndex,
  openPath,
  dir,
  onToggleSubmenu,
  onNavigate,
  menuRef,
  menuPosition
}: CategoryTreeMenuProps) {
  const columns = getSubmenuColumns(nodes, openPath);

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top: menuPosition?.top ?? -9999,
        left: menuPosition?.left ?? -9999,
        visibility: menuPosition ? 'visible' : 'hidden'
      }}
      className="z-[100] flex items-start gap-1"
    >
      {columns.map((columnNodes, depth) => (
          <CategorySubmenuColumn
            key={depth}
            nodes={columnNodes}
            localizedPath={localizedPath}
            adCountLabel={adCountLabel}
            mapCategoryToDisplay={mapCategoryToDisplay}
            parentIndex={getColumnParentIndex(parentIndex, columns, openPath, depth)}
            openPath={openPath}
            depth={depth}
            dir={dir}
            onToggleSubmenu={onToggleSubmenu}
            onNavigate={onNavigate}
          />
        ))}
    </div>
  );
}

type CategoryGridCardProps = {
  category: DisplayCategory;
  childrenCategories: CategoryTreeNode<ApiCategory>[];
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  localizedPath: (path: string) => string;
  adCountLabel: string;
  expandLabel: string;
  mapCategoryToDisplay: (category: ApiCategory, index: number) => DisplayCategory;
  parentIndex: number;
  dir: 'rtl' | 'ltr';
};

function CategoryGridCard({
  category,
  childrenCategories,
  isMenuOpen,
  onToggleMenu,
  onCloseMenu,
  localizedPath,
  adCountLabel,
  expandLabel,
  mapCategoryToDisplay,
  parentIndex,
  dir
}: CategoryGridCardProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [openPath, setOpenPath] = useState<string[]>([]);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const hasChildren = childrenCategories.length > 0;

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateMenuPosition = () => {
    const trigger = triggerRef.current;
    const menu = menuRef.current;
    if (!trigger || !menu) return;

    const triggerRect = trigger.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    const gap = 6;
    const edgePadding = 8;

    let left = dir === 'rtl' ? triggerRect.right - menuRect.width : triggerRect.left;
    left = Math.max(edgePadding, Math.min(left, window.innerWidth - menuRect.width - edgePadding));

    let top = triggerRect.bottom + gap;
    if (top + menuRect.height > window.innerHeight - edgePadding) {
      top = triggerRect.top - gap - menuRect.height;
    }
    top = Math.max(edgePadding, top);

    setMenuPosition((current) => {
      if (current?.top === top && current.left === left) {
        return current;
      }

      return { top, left };
    });
  };

  useLayoutEffect(() => {
    if (!isMenuOpen) {
      setMenuPosition((current) => (current === null ? current : null));
      return;
    }

    updateMenuPosition();
  }, [isMenuOpen, openPath, dir]);

  useEffect(() => {
    if (!isMenuOpen) {
      setOpenPath((current) => (current.length === 0 ? current : []));
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      onCloseMenu();
    };

    const handleReposition = () => updateMenuPosition();

    document.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [isMenuOpen, onCloseMenu, dir]);

  const toggleSubmenu = (depth: number, nodeId: string) => {
    setOpenPath((current) => {
      if (current[depth] === nodeId) {
        return current.slice(0, depth);
      }

      return [...current.slice(0, depth), nodeId];
    });
  };

  const menu =
    isMenuOpen && mounted ? (
      <CategoryTreeMenu
        nodes={childrenCategories}
        localizedPath={localizedPath}
        adCountLabel={adCountLabel}
        mapCategoryToDisplay={mapCategoryToDisplay}
        parentIndex={parentIndex}
        openPath={openPath}
        dir={dir}
        onToggleSubmenu={toggleSubmenu}
        onNavigate={onCloseMenu}
        menuRef={menuRef}
        menuPosition={menuPosition}
      />
    ) : null;

  return (
    <div className={`relative h-full ${isMenuOpen ? 'z-40' : ''}`}>
      <div
        className={`${colorClasses[category.color]} flex h-full flex-col overflow-hidden rounded-2xl shadow-sm transition-shadow hover:shadow-lg`}
      >
        <Link
          href={localizedPath(category.href)}
          className="group flex flex-1 flex-col items-center p-6 text-center transition-transform hover:-translate-y-0.5"
        >
          <CategoryIcon icon={category.iconKey} size={40} />
          <h3 className="mt-4 font-bold text-ink-900">{category.name}</h3>
          <p className="mt-1 text-sm text-slate-500">
            {category.count} {adCountLabel}
          </p>
        </Link>

        {hasChildren ? (
          <>
            <button
              ref={triggerRef}
              type="button"
              onClick={onToggleMenu}
              aria-expanded={isMenuOpen}
              aria-haspopup="menu"
              aria-label={expandLabel}
              className="flex w-full items-center justify-center border-t border-black/5 py-2 text-current transition hover:bg-black/5"
            >
              <ChevronDown
                size={20}
                className={`transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {mounted && menu ? createPortal(menu, document.body) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}

export function CategoriesSection() {
  const { locale, dir, localizedPath, m } = useI18n();
  const [apiCategories, setApiCategories] = useState<ApiCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    api
      .get<{ data: ApiCategory[] }>('/categories', { params: { locale } })
      .then((response) => setApiCategories(response.data.data))
      .catch(() => setApiCategories([]))
      .finally(() => setIsLoading(false));
  }, [locale]);

  const categoryTree = useMemo(() => buildCategoryTree(apiCategories), [apiCategories]);

  const toggleMenu = (parentId: string) => {
    setOpenMenuId((current) => (current === parentId ? null : parentId));
  };

  const closeMenu = () => setOpenMenuId(null);

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
        <div className="relative mb-8 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-6">
          {categoryTree.map((parent: CategoryTreeNode<ApiCategory>, parentIndex) => {
            const parentDisplay = mapCategoryToDisplay(parent, parentIndex);

            return (
              <CategoryGridCard
                key={parent.id}
                category={parentDisplay}
                childrenCategories={parent.children}
                isMenuOpen={openMenuId === parent.id}
                onToggleMenu={() => toggleMenu(parent.id)}
                onCloseMenu={closeMenu}
                localizedPath={localizedPath}
                adCountLabel={m.home.adCount}
                expandLabel={expandLabel}
                mapCategoryToDisplay={mapCategoryToDisplay}
                parentIndex={parentIndex}
                dir={dir}
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
