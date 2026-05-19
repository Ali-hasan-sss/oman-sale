'use client';

import {
  Baby,
  Bike,
  BookOpen,
  Briefcase,
  Building2,
  Car,
  Check,
  Edit3,
  Gamepad2,
  GraduationCap,
  Heart,
  Home,
  Laptop,
  MapPin,
  Monitor,
  Palette,
  Plus,
  Search,
  Shirt,
  Smartphone,
  Sofa,
  Store,
  Stethoscope,
  Tag,
  Trash2,
  Truck,
  Utensils,
  Watch,
  Wrench,
  X
} from 'lucide-react';
import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from 'react';

import { adminApi } from '@/lib/admin-auth';
import { useI18n } from '@/lib/i18n';

type CategoryType = 'PRODUCT' | 'SERVICE' | 'JOB' | 'JOB_REQUEST' | 'LOGISTICS' | 'CONSTRUCTION';

type IconKey =
  | 'baby'
  | 'bike'
  | 'book'
  | 'briefcase'
  | 'building'
  | 'car'
  | 'gamepad'
  | 'graduation'
  | 'heart'
  | 'home'
  | 'laptop'
  | 'map-pin'
  | 'monitor'
  | 'palette'
  | 'search'
  | 'shirt'
  | 'smartphone'
  | 'sofa'
  | 'store'
  | 'stethoscope'
  | 'tag'
  | 'truck'
  | 'utensils'
  | 'watch'
  | 'wrench';

type ManagedCategory = {
  id: string;
  name: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  icon?: IconKey | null;
  type: CategoryType;
  parentId?: string | null;
  isActive: boolean;
  filters?: Array<{
    id: string;
    titleAr: string;
    titleEn: string;
  }>;
  _count?: {
    ads: number;
    children: number;
    filters: number;
  };
};

type CategoriesResponse = {
  items: ManagedCategory[];
  total: number;
  page: number;
  limit: number;
};

type CategoryFormState = {
  nameAr: string;
  nameEn: string;
  slug: string;
  icon: IconKey | '';
  type: CategoryType;
  parentId: string;
  isActive: boolean;
};

type CategoryFormErrors = Partial<Record<keyof CategoryFormState, string>>;
type SlugStatus = 'idle' | 'checking' | 'available' | 'unavailable' | 'invalid';
type CategoryFilter = {
  id: string;
  titleAr: string;
  titleEn: string;
  options: Array<{ id: string; labelAr: string; labelEn: string }>;
};

const categoryTypes: CategoryType[] = ['PRODUCT', 'SERVICE', 'JOB', 'JOB_REQUEST', 'LOGISTICS', 'CONSTRUCTION'];

const iconOptions: Array<{ key: IconKey; label: string; icon: typeof Car }> = [
  { key: 'car', label: 'Cars', icon: Car },
  { key: 'building', label: 'Real estate', icon: Building2 },
  { key: 'home', label: 'Home', icon: Home },
  { key: 'store', label: 'Stores', icon: Store },
  { key: 'shirt', label: 'Fashion', icon: Shirt },
  { key: 'smartphone', label: 'Mobile', icon: Smartphone },
  { key: 'laptop', label: 'Computers', icon: Laptop },
  { key: 'monitor', label: 'Electronics', icon: Monitor },
  { key: 'sofa', label: 'Furniture', icon: Sofa },
  { key: 'wrench', label: 'Services', icon: Wrench },
  { key: 'briefcase', label: 'Jobs', icon: Briefcase },
  { key: 'search', label: 'Job seekers', icon: Search },
  { key: 'truck', label: 'Logistics', icon: Truck },
  { key: 'book', label: 'Books', icon: BookOpen },
  { key: 'graduation', label: 'Training', icon: GraduationCap },
  { key: 'gamepad', label: 'Gaming', icon: Gamepad2 },
  { key: 'bike', label: 'Bikes', icon: Bike },
  { key: 'baby', label: 'Kids', icon: Baby },
  { key: 'heart', label: 'Pets', icon: Heart },
  { key: 'tag', label: 'Offers', icon: Tag },
  { key: 'map-pin', label: 'Places', icon: MapPin },
  { key: 'palette', label: 'Design', icon: Palette },
  { key: 'utensils', label: 'Food', icon: Utensils },
  { key: 'stethoscope', label: 'Health', icon: Stethoscope },
  { key: 'watch', label: 'Accessories', icon: Watch }
];

const iconMap = Object.fromEntries(iconOptions.map((option) => [option.key, option.icon])) as Record<IconKey, typeof Car>;

const initialForm: CategoryFormState = {
  nameAr: '',
  nameEn: '',
  slug: '',
  icon: '',
  type: 'PRODUCT',
  parentId: '',
  isActive: true
};

const createSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function AdminCategoriesManagement() {
  const { m } = useI18n();
  const [categories, setCategories] = useState<ManagedCategory[]>([]);
  const [typeFilter, setTypeFilter] = useState('');
  const [form, setForm] = useState<CategoryFormState>(initialForm);
  const [formErrors, setFormErrors] = useState<CategoryFormErrors>({});
  const [slugStatus, setSlugStatus] = useState<SlugStatus>('idle');
  const [editingId, setEditingId] = useState<string>();
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(25);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [categoryFilters, setCategoryFilters] = useState<CategoryFilter[]>([]);
  const [filterTitleAr, setFilterTitleAr] = useState('');
  const [filterTitleEn, setFilterTitleEn] = useState('');
  const [filterOptionsText, setFilterOptionsText] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  const typeLabels = useMemo<Record<CategoryType, string>>(
    () => ({
      PRODUCT: m.admin.product,
      SERVICE: m.admin.service,
      JOB: m.admin.job,
      JOB_REQUEST: m.admin.jobRequest,
      LOGISTICS: m.admin.logistics,
      CONSTRUCTION: m.admin.construction
    }),
    [m.admin]
  );

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const parentOptions = categories.filter((category) => category.id !== editingId);

  const loadCategories = async () => {
    setIsLoading(true);
    setError(undefined);

    try {
      const response = await adminApi().get<{ data: CategoriesResponse }>('/admin/categories', {
        params: {
          page,
          type: typeFilter || undefined
        }
      });
      setCategories(response.data.data.items);
      setTotal(response.data.data.total);
      setLimit(response.data.data.limit);
    } catch {
      setError(m.admin.categoriesLoadError);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, [page, typeFilter, m.admin.categoriesLoadError]);

  const loadCategoryFilters = async (categoryId: string) => {
    const response = await adminApi().get<{ data: CategoryFilter[] }>(`/categories/${categoryId}/filters`, {
      params: { includeInactive: true, locale: 'ar' }
    });
    setCategoryFilters(response.data.data);
  };

  useEffect(() => {
    if (!editingId) {
      setCategoryFilters([]);
      return;
    }

    loadCategoryFilters(editingId).catch(() => setCategoryFilters([]));
  }, [editingId]);

  const resetForm = () => {
    setForm(initialForm);
    setFormErrors({});
    setSlugStatus('idle');
    setEditingId(undefined);
  };

  const startEdit = (category: ManagedCategory) => {
    setEditingId(category.id);
    setForm({
      nameAr: category.nameAr,
      nameEn: category.nameEn,
      slug: category.slug,
      icon: category.icon ?? '',
      type: category.type,
      parentId: category.parentId ?? '',
      isActive: category.isActive
    });
    setFormErrors({});
    setSlugStatus('idle');
    window.setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  const createFilter = async () => {
    if (!editingId || !filterTitleAr.trim() || !filterTitleEn.trim()) return;

    const options = filterOptionsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [labelAr, labelEn] = line.split('|').map((value) => value?.trim());
        return { labelAr: labelAr || '', labelEn: labelEn || labelAr || '' };
      })
      .filter((option) => option.labelAr && option.labelEn);

    if (options.length === 0) return;

    await adminApi().post(`/categories/${editingId}/filters`, {
      titleAr: filterTitleAr,
      titleEn: filterTitleEn,
      options
    });
    setFilterTitleAr('');
    setFilterTitleEn('');
    setFilterOptionsText('');
    await loadCategoryFilters(editingId);
  };

  const deleteFilter = async (filterId: string) => {
    if (!editingId) return;
    await adminApi().delete(`/categories/filters/${filterId}`);
    await loadCategoryFilters(editingId);
  };

  const resolvedSlug = form.slug || createSlug(form.nameEn || form.nameAr);

  useEffect(() => {
    if (!resolvedSlug) {
      setSlugStatus('idle');
      return;
    }

    if (!slugPattern.test(resolvedSlug)) {
      setSlugStatus('invalid');
      return;
    }

    setSlugStatus('checking');

    const timeoutId = window.setTimeout(() => {
      adminApi()
        .get<{ data: { available: boolean } }>('/admin/categories/slug-availability', {
          params: {
            slug: resolvedSlug,
            excludeId: editingId
          }
        })
        .then((response) => setSlugStatus(response.data.data.available ? 'available' : 'unavailable'))
        .catch(() => setSlugStatus('idle'));
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [editingId, resolvedSlug]);

  const validateForm = () => {
    const nextErrors: CategoryFormErrors = {};
    if (form.nameAr.trim().length < 2) nextErrors.nameAr = m.admin.requiredField;
    if (form.nameEn.trim().length < 2) nextErrors.nameEn = m.admin.requiredField;
    if (!form.icon) nextErrors.icon = m.admin.requiredField;
    if (!resolvedSlug || !slugPattern.test(resolvedSlug)) nextErrors.slug = m.admin.invalidSlug;
    if (slugStatus === 'checking') nextErrors.slug = m.admin.slugChecking;
    if (slugStatus === 'unavailable') nextErrors.slug = m.admin.slugUnavailable;

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);

    const payload = {
      nameAr: form.nameAr.trim(),
      nameEn: form.nameEn.trim(),
      slug: form.slug || createSlug(form.nameEn || form.nameAr),
      icon: form.icon,
      type: form.type,
      parentId: form.parentId || null,
      isActive: form.isActive
    };

    try {
      if (editingId) {
        await adminApi().patch(`/admin/categories/${editingId}`, payload);
      } else {
        await adminApi().post('/admin/categories', payload);
      }

      resetForm();
      await loadCategories();
    } finally {
      setIsSaving(false);
    }
  };

  const deleteCategory = async (categoryId: string) => {
    await adminApi().delete(`/admin/categories/${categoryId}`);
    await loadCategories();
  };

  const changeTypeFilter = (nextType: string) => {
    setTypeFilter(nextType);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-black">{m.admin.categoriesManagement}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {total} {m.admin.totalResults}
            </p>
          </div>
          <select
            value={typeFilter}
            onChange={(event) => changeTypeFilter(event.target.value)}
            className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">{m.admin.allAdTypes}</option>
            {categoryTypes.map((type) => (
              <option key={type} value={type}>
                {typeLabels[type]}
              </option>
            ))}
          </select>
        </div>

        {error ? <div className="mb-4 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div> : null}
        {Object.keys(formErrors).length > 0 ? (
          <div className="mb-4 rounded-xl bg-amber-50 p-4 text-sm font-bold text-amber-800">{m.admin.categoryFormError}</div>
        ) : null}

        <form ref={formRef} onSubmit={submit} className="mb-8 grid gap-4 rounded-2xl bg-slate-50 p-4 lg:grid-cols-3">
          <Field label={m.admin.nameAr} error={formErrors.nameAr}>
            <input
              value={form.nameAr}
              onChange={(event) => setForm((current) => ({ ...current, nameAr: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
            />
          </Field>

          <Field label={m.admin.nameEn} error={formErrors.nameEn}>
            <input
              dir="ltr"
              value={form.nameEn}
              onChange={(event) => setForm((current) => ({ ...current, nameEn: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
            />
          </Field>

          <Field label={m.admin.slug} error={formErrors.slug}>
            <div className="relative">
              <input
                dir="ltr"
                value={form.slug}
                onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
                placeholder={createSlug(form.nameEn || form.nameAr)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 outline-none focus:ring-2 focus:ring-brand-500"
              />
              <SlugStatusIndicator
                availableLabel={m.admin.slugAvailable}
                checkingLabel={m.admin.slugChecking}
                status={slugStatus}
                unavailableLabel={m.admin.slugUnavailable}
              />
            </div>
          </Field>

          <Field label={m.admin.icon} error={formErrors.icon}>
            <IconPicker
              emptyLabel={m.admin.selectIcon}
              onChange={(icon) => setForm((current) => ({ ...current, icon }))}
              value={form.icon}
            />
          </Field>

          <Field label={m.admin.adType}>
            <select
              value={form.type}
              onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as CategoryType }))}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
            >
              {categoryTypes.map((type) => (
                <option key={type} value={type}>
                  {typeLabels[type]}
                </option>
              ))}
            </select>
          </Field>

          <Field label={m.admin.parentCategory}>
            <select
              value={form.parentId}
              onChange={(event) => setForm((current) => ({ ...current, parentId: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">{m.admin.noParent}</option>
              {parentOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.nameAr} / {category.nameEn}
                </option>
              ))}
            </select>
          </Field>

          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
            />
            {m.admin.isActive}
          </label>

          <div className="flex gap-3 lg:col-span-3">
            <button
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 font-bold text-white transition hover:bg-brand-700 disabled:opacity-60"
            >
              <Plus size={18} />
              {editingId ? m.admin.updateCategory : m.admin.createCategory}
            </button>
            {editingId ? (
              <button type="button" onClick={resetForm} className="rounded-xl border border-slate-200 px-5 py-3 font-bold text-slate-700">
                {m.admin.cancel}
              </button>
            ) : null}
          </div>
        </form>

        {editingId ? (
          <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-4">
              <h3 className="text-lg font-black">فلاتر هذه الفئة</h3>
              <p className="text-sm text-slate-500">
                اكتب الخيارات كل خيار في سطر، ويمكن فصل العربي والإنجليزي بعلامة | مثل: جديد | New
              </p>
            </div>

            <div className="mb-5 grid gap-4 lg:grid-cols-3">
              <input
                value={filterTitleAr}
                onChange={(event) => setFilterTitleAr(event.target.value)}
                placeholder="عنوان الفلتر بالعربية"
                className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
              />
              <input
                dir="ltr"
                value={filterTitleEn}
                onChange={(event) => setFilterTitleEn(event.target.value)}
                placeholder="Filter title in English"
                className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
              />
              <textarea
                value={filterOptionsText}
                onChange={(event) => setFilterOptionsText(event.target.value)}
                placeholder={'جديد | New\nمستعمل | Used'}
                className="min-h-24 rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="button"
                onClick={createFilter}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 font-bold text-white transition hover:bg-brand-700 lg:col-span-3"
              >
                <Plus size={18} />
                إضافة فلتر للفئة
              </button>
            </div>

            <div className="space-y-3">
              {categoryFilters.map((filter) => (
                <div key={filter.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-black">{filter.titleAr}</p>
                      <p className="text-sm text-slate-500">{filter.titleEn}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteFilter(filter.id)}
                      className="rounded-lg border border-red-100 px-3 py-2 text-sm font-bold text-red-600 transition hover:bg-red-50"
                    >
                      حذف
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {filter.options.map((option) => (
                      <span key={option.id} className="rounded-full bg-white px-3 py-1 text-sm text-slate-700 ring-1 ring-slate-200">
                        {option.labelAr} / {option.labelEn}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 text-start">{m.admin.icon}</th>
                <th className="px-4 py-3 text-start">{m.admin.nameAr}</th>
                <th className="px-4 py-3 text-start">{m.admin.nameEn}</th>
                <th className="px-4 py-3 text-start">{m.admin.adType}</th>
                <th className="px-4 py-3 text-start">الفلاتر</th>
                <th className="px-4 py-3 text-start">{m.admin.adsCount}</th>
                <th className="px-4 py-3 text-start">{m.admin.status}</th>
                <th className="px-4 py-3 text-start">{m.admin.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center font-bold text-slate-500">
                    {m.admin.loading}
                  </td>
                </tr>
              ) : (
                categories.map((category) => {
                  const Icon = category.icon ? iconMap[category.icon] ?? Tag : Tag;

                  return (
                    <tr key={category.id}>
                      <td className="px-4 py-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                          <Icon size={20} />
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold">{category.nameAr}</td>
                      <td className="px-4 py-3 text-slate-600">{category.nameEn}</td>
                      <td className="px-4 py-3">{typeLabels[category.type]}</td>
                      <td className="px-4 py-3">
                        <div className="flex max-w-56 flex-wrap gap-1.5">
                          {category.filters && category.filters.length > 0 ? (
                            category.filters.map((filter) => (
                              <span key={filter.id} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-100">
                                {filter.titleAr}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">{category._count?.ads ?? 0}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${category.isActive ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                          {category.isActive ? m.admin.active : m.admin.inactive}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => startEdit(category)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 font-bold text-slate-700 transition hover:bg-slate-50"
                          >
                            <Edit3 size={14} />
                            {m.admin.editCategory}
                          </button>
                          <button
                            onClick={() => deleteCategory(category.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-100 px-3 py-2 font-bold text-red-600 transition hover:bg-red-50"
                          >
                            <Trash2 size={14} />
                            {m.admin.deleteCategory}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-bold text-slate-500">
            {m.admin.page} {page} {m.admin.of} {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              {m.admin.previous}
            </button>
            <button
              disabled={page >= totalPages || isLoading}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              {m.admin.next}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function Field({ children, error, label }: { children: ReactNode; error?: string; label: string }) {
  return (
    <div className="space-y-2">
      <span className="block text-sm font-bold text-slate-700">{label}</span>
      {children}
      {error ? <span className="block text-xs font-bold text-red-600">{error}</span> : null}
    </div>
  );
}

function IconPicker({
  emptyLabel,
  onChange,
  value
}: {
  emptyLabel: string;
  onChange: (icon: IconKey) => void;
  value: IconKey | '';
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = value ? iconOptions.find((option) => option.key === value) : undefined;
  const SelectedIcon = selectedOption?.icon;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-700 outline-none transition focus:ring-2 focus:ring-brand-500"
      >
        <span className="flex items-center gap-3 font-bold">
          {SelectedIcon ? (
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <SelectedIcon size={18} />
            </span>
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
              <Tag size={18} />
            </span>
          )}
          <span>{selectedOption?.label ?? emptyLabel}</span>
        </span>
        <span className="text-xs text-slate-400">▾</span>
      </button>

      {isOpen ? (
        <div className="absolute z-40 mt-2 grid max-h-64 w-full grid-cols-5 gap-2 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
          {iconOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = value === option.key;

            return (
              <button
                key={option.key}
                type="button"
                title={option.label}
                onClick={() => {
                  onChange(option.key);
                  setIsOpen(false);
                }}
                className={`flex h-11 items-center justify-center rounded-xl border transition ${
                  isSelected
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-slate-100 text-slate-600 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700'
                }`}
              >
                <Icon size={20} />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function SlugStatusIndicator({
  availableLabel,
  checkingLabel,
  status,
  unavailableLabel
}: {
  availableLabel: string;
  checkingLabel: string;
  status: SlugStatus;
  unavailableLabel: string;
}) {
  if (status === 'idle') return null;

  if (status === 'checking') {
    return (
      <span className="absolute inset-y-0 right-3 flex items-center text-xs font-bold text-slate-400">
        {checkingLabel}
      </span>
    );
  }

  const isAvailable = status === 'available';

  return (
    <span
      title={isAvailable ? availableLabel : unavailableLabel}
      className={`absolute inset-y-0 right-3 flex items-center ${isAvailable ? 'text-green-600' : 'text-red-600'}`}
    >
      {isAvailable ? <Check size={18} /> : <X size={18} />}
    </span>
  );
}
