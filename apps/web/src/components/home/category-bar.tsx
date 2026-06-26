'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

import { api } from '@/lib/api';
import { CategoryIcon } from '@/lib/category-icons';
import { buildCategoryTree, type CategoryTreeNode } from '@/lib/category-tree';
import { useI18n } from '@/lib/i18n';

type ApiCategory = {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  sortOrder?: number;
  icon?: string | null;
  _count?: {
    ads: number;
    children?: number;
  };
};

export function CategoryBar() {
  const { locale, dir, localizedPath } = useI18n();
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api
      .get<{ data: ApiCategory[] }>('/categories', { params: { locale } })
      .then((response) => setCategories(response.data.data))
      .catch(() => setCategories([]));
  }, [locale]);

  const tree = useMemo(() => buildCategoryTree(categories), [categories]);

  useEffect(() => {
    if (!openId) return undefined;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpenId(null);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [openId]);

  if (tree.length === 0) return null;

  const openCategory = tree.find((category) => category.id === openId) ?? null;

  return (
    <div ref={containerRef} className="relative z-30 border-y border-slate-200 bg-white" dir={dir}>
      <div className="site-container">
        <div className="thin-scrollbar flex overflow-x-auto">
          {tree.map((category: CategoryTreeNode<ApiCategory>) => {
            const hasChildren = category.children.length > 0;
            const isOpen = openId === category.id;
            const itemClass = `flex shrink-0 items-center gap-2 border-e border-slate-200 px-4 py-3 text-sm font-bold text-ink-900 transition hover:bg-slate-50 ${
              isOpen ? 'bg-slate-50 text-brand-700' : ''
            }`;
            const inner = (
              <>
                <CategoryIcon icon={category.icon} size={20} />
                <span className="whitespace-nowrap">{category.name}</span>
              </>
            );

            if (!hasChildren) {
              return (
                <Link key={category.id} href={localizedPath(`/category/${category.slug}`)} className={itemClass}>
                  {inner}
                </Link>
              );
            }

            return (
              <button
                key={category.id}
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpenId(isOpen ? null : category.id)}
                className={itemClass}
              >
                {inner}
              </button>
            );
          })}
        </div>
      </div>

      {openCategory ? (
        <div className="absolute inset-x-0 top-full z-50 border-b border-slate-200 bg-white shadow-xl">
          <div className="site-container py-5">
            <div className="grid grid-cols-3 gap-x-4 gap-y-5">
              {openCategory.children.map((child) => (
                <Link
                  key={child.id}
                  href={localizedPath(`/category/${child.slug}`)}
                  onClick={() => setOpenId(null)}
                  className="group flex flex-col items-center gap-2 text-center"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-brand-600 transition group-hover:bg-brand-50">
                    <CategoryIcon icon={child.icon} size={24} />
                  </span>
                  <span className="text-xs font-bold text-ink-900">{child.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
