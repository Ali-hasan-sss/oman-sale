'use client';

import {
  Check,
  ChevronDown,
  ChevronLeft,
  Edit3,
  Filter,
  Plus,
  Search,
  Tag,
  Trash2,
  X
} from 'lucide-react';
import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { CategoriesSkeleton } from '@/components/admin/admin-categories-skeleton';
import { adminApi } from '@/lib/admin-auth';
import {
  CategoryIcon,
  categoryIconKeys,
  categoryIconLabels,
  categoryIconMap,
  isCategoryEmojiIcon,
  isCategoryIconKey
} from '@/lib/category-icons';
import { buildCategoryTree, type CategoryTreeNode } from '@/lib/category-tree';
import { useI18n } from '@/lib/i18n';

type CategoryType = 'PRODUCT' | 'SERVICE' | 'JOB' | 'JOB_REQUEST' | 'LOGISTICS' | 'CONSTRUCTION';

type ManagedCategory = {
  id: string;
  name: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  icon?: string | null;
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
  icon: string;
  type: CategoryType;
  parentId: string;
  isActive: boolean;
};

type CategoryFormErrors = Partial<Record<keyof CategoryFormState, string>>;
type SlugStatus = 'idle' | 'checking' | 'available' | 'unavailable' | 'invalid';
type FormMode = 'create-parent' | 'create-child' | 'edit';
type CategoryFilter = {
  id: string;
  titleAr: string;
  titleEn: string;
  options: Array<{ id: string; labelAr: string; labelEn: string }>;
};

const categoryTypes: CategoryType[] = ['PRODUCT', 'SERVICE', 'JOB', 'JOB_REQUEST', 'LOGISTICS', 'CONSTRUCTION'];

const iconOptions = categoryIconKeys.map((key) => ({
  key,
  label: categoryIconLabels[key],
  icon: categoryIconMap[key]
}));

const iconMap = categoryIconMap;

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

type FilterOptionDraft = {
  labelAr: string;
  labelEn: string;
};

function filterCategoryTree(
  nodes: CategoryTreeNode<ManagedCategory>[],
  query: string
): CategoryTreeNode<ManagedCategory>[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return nodes;

  const matchesCategory = (category: ManagedCategory) =>
    category.nameAr.toLowerCase().includes(normalized) ||
    category.nameEn.toLowerCase().includes(normalized) ||
    category.slug.toLowerCase().includes(normalized);

  const filterNode = (node: CategoryTreeNode<ManagedCategory>): CategoryTreeNode<ManagedCategory> | null => {
    const filteredChildren = node.children
      .map(filterNode)
      .filter((child): child is CategoryTreeNode<ManagedCategory> => child !== null);

    if (!matchesCategory(node) && filteredChildren.length === 0) return null;

    return { ...node, children: filteredChildren };
  };

  return nodes
    .map(filterNode)
    .filter((node): node is CategoryTreeNode<ManagedCategory> => node !== null);
}

function collectExpandableNodeIds(nodes: CategoryTreeNode<ManagedCategory>[]) {
  const ids: Record<string, boolean> = {};

  const walk = (items: CategoryTreeNode<ManagedCategory>[]) => {
    items.forEach((node) => {
      if (node.children.length > 0) {
        ids[node.id] = true;
        walk(node.children);
      }
    });
  };

  walk(nodes);
  return ids;
}

export function AdminCategoriesManagement() {
  const { m } = useI18n();
  const [categories, setCategories] = useState<ManagedCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearchQuery, setAppliedSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [form, setForm] = useState<CategoryFormState>(initialForm);
  const [formErrors, setFormErrors] = useState<CategoryFormErrors>({});
  const [slugStatus, setSlugStatus] = useState<SlugStatus>('idle');
  const [editingId, setEditingId] = useState<string>();
  const [formMode, setFormMode] = useState<FormMode>('create-parent');
  const [lockedParentName, setLockedParentName] = useState('');
  const [total, setTotal] = useState(0);
  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [categoryFilters, setCategoryFilters] = useState<CategoryFilter[]>([]);
  const [filtersCategory, setFiltersCategory] = useState<ManagedCategory | null>(null);
  const [filterTitleAr, setFilterTitleAr] = useState('');
  const [filterTitleEn, setFilterTitleEn] = useState('');
  const [draftOptionAr, setDraftOptionAr] = useState('');
  const [draftOptionEn, setDraftOptionEn] = useState('');
  const [pendingFilterOptions, setPendingFilterOptions] = useState<FilterOptionDraft[]>([]);
  const [editingFilterId, setEditingFilterId] = useState<string | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);
  const [filtersLoading, setFiltersLoading] = useState(false);
  const [filtersSaving, setFiltersSaving] = useState(false);

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

  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);
  const filteredCategoryTree = useMemo(
    () => filterCategoryTree(categoryTree, appliedSearchQuery),
    [appliedSearchQuery, categoryTree]
  );

  const loadCategories = async () => {
    setIsLoading(true);
    setError(undefined);

    try {
      const response = await adminApi().get<{ data: CategoriesResponse }>('/admin/categories', {
        params: {
          all: true,
          type: typeFilter || undefined
        }
      });
      setCategories(response.data.data.items);
      setTotal(response.data.data.total);
    } catch {
      setError(m.admin.categoriesLoadError);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, [typeFilter, m.admin.categoriesLoadError]);

  useEffect(() => {
    setExpandedParents((current) => {
      const next = { ...current };
      categoryTree.forEach((parent) => {
        if (next[parent.id] === undefined) next[parent.id] = true;
      });
      return next;
    });
  }, [categoryTree]);

  useEffect(() => {
    if (!appliedSearchQuery.trim()) return;
    setExpandedParents((current) => ({ ...current, ...collectExpandableNodeIds(filteredCategoryTree) }));
  }, [appliedSearchQuery, filteredCategoryTree]);

  const loadCategoryFilters = async (categoryId: string) => {
    const response = await adminApi().get<{ data: CategoryFilter[] }>(`/categories/${categoryId}/filters`, {
      params: { includeInactive: true, locale: 'ar' }
    });
    setCategoryFilters(response.data.data);
  };

  const resetForm = () => {
    setForm(initialForm);
    setFormErrors({});
    setSlugStatus('idle');
    setEditingId(undefined);
    setFormMode('create-parent');
    setLockedParentName('');
    setIsFormModalOpen(false);
  };

  const openFormModal = () => {
    setIsFormModalOpen(true);
  };

  const startAddParent = () => {
    setForm(initialForm);
    setFormErrors({});
    setSlugStatus('idle');
    setEditingId(undefined);
    setFormMode('create-parent');
    setLockedParentName('');
    openFormModal();
  };

  const expandCategoryAncestors = (category: ManagedCategory) => {
    const next: Record<string, boolean> = {};
    let currentParentId = category.parentId;

    while (currentParentId) {
      next[currentParentId] = true;
      currentParentId = categories.find((item) => item.id === currentParentId)?.parentId ?? null;
    }

    setExpandedParents((current) => ({ ...current, ...next }));
  };

  const startAddChild = (parent: ManagedCategory) => {
    setEditingId(undefined);
    setFormMode('create-child');
    setLockedParentName(`${parent.nameAr} / ${parent.nameEn}`);
    setForm({
      ...initialForm,
      type: parent.type,
      parentId: parent.id
    });
    setFormErrors({});
    setSlugStatus('idle');
    setExpandedParents((current) => ({ ...current, [parent.id]: true }));
    openFormModal();
  };

  const startEdit = (category: ManagedCategory) => {
    const parent = category.parentId ? categories.find((item) => item.id === category.parentId) : undefined;
    setEditingId(category.id);
    setFormMode('edit');
    setLockedParentName(parent ? `${parent.nameAr} / ${parent.nameEn}` : '');
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
    if (category.parentId) {
      expandCategoryAncestors(category);
    }
    openFormModal();
  };

  const toggleParentExpanded = (parentId: string) => {
    setExpandedParents((current) => ({ ...current, [parentId]: !current[parentId] }));
  };

  const resetFilterForm = () => {
    setEditingFilterId(null);
    setFilterTitleAr('');
    setFilterTitleEn('');
    setDraftOptionAr('');
    setDraftOptionEn('');
    setPendingFilterOptions([]);
  };

  const addPendingFilterOption = () => {
    const labelAr = draftOptionAr.trim();
    const labelEn = draftOptionEn.trim();
    if (!labelAr || !labelEn) return;

    setPendingFilterOptions((current) => [...current, { labelAr, labelEn }]);
    setDraftOptionAr('');
    setDraftOptionEn('');
  };

  const removePendingFilterOption = (index: number) => {
    setPendingFilterOptions((current) => current.filter((_, optionIndex) => optionIndex !== index));
  };

  const closeFiltersModal = () => {
    setIsFiltersModalOpen(false);
    setFiltersCategory(null);
    setCategoryFilters([]);
    resetFilterForm();
  };

  const openFiltersModal = async (category: ManagedCategory) => {
    setFiltersCategory(category);
    setIsFiltersModalOpen(true);
    setFiltersLoading(true);
    resetFilterForm();

    try {
      await loadCategoryFilters(category.id);
    } catch {
      setCategoryFilters([]);
    } finally {
      setFiltersLoading(false);
    }
  };

  const startEditFilter = (filter: CategoryFilter) => {
    setEditingFilterId(filter.id);
    setFilterTitleAr(filter.titleAr);
    setFilterTitleEn(filter.titleEn);
    setDraftOptionAr('');
    setDraftOptionEn('');
    setPendingFilterOptions(
      filter.options.map((option) => ({
        labelAr: option.labelAr,
        labelEn: option.labelEn
      }))
    );
  };

  const saveFilter = async () => {
    if (!filtersCategory || !filterTitleAr.trim() || !filterTitleEn.trim()) return;

    const options = pendingFilterOptions;
    if (options.length === 0) return;

    setFiltersSaving(true);
    try {
      if (editingFilterId) {
        await adminApi().patch(`/categories/filters/${editingFilterId}`, {
          titleAr: filterTitleAr.trim(),
          titleEn: filterTitleEn.trim(),
          options
        });
      } else {
        await adminApi().post(`/categories/${filtersCategory.id}/filters`, {
          titleAr: filterTitleAr.trim(),
          titleEn: filterTitleEn.trim(),
          options
        });
      }

      resetFilterForm();
      await loadCategoryFilters(filtersCategory.id);
      await loadCategories();
    } finally {
      setFiltersSaving(false);
    }
  };

  const deleteFilter = async (filterId: string) => {
    if (!filtersCategory || !window.confirm(m.admin.confirmDeleteFilter)) return;

    setFiltersSaving(true);
    try {
      await adminApi().delete(`/categories/filters/${filterId}`);
      if (editingFilterId === filterId) resetFilterForm();
      await loadCategoryFilters(filtersCategory.id);
      await loadCategories();
    } finally {
      setFiltersSaving(false);
    }
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
  };

  const applyCategorySearch = () => {
    setAppliedSearchQuery(searchQuery.trim());
  };

  const formTitle =
    formMode === 'create-child'
      ? `${m.admin.subcategoryOf}: ${lockedParentName}`
      : formMode === 'edit'
        ? m.admin.updateCategory
        : m.admin.addParentCategory;

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
          <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={startAddParent}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-3 font-bold text-white transition hover:bg-brand-700"
          >
            <Plus size={18} />
            {m.admin.addParentCategory}
          </button>
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
        </div>

        {error ? <div className="mb-4 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div> : null}

        <div className="mb-5 flex flex-col gap-3 lg:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') applyCategorySearch();
              }}
              placeholder={m.admin.searchCategories}
              className="w-full rounded-xl border border-slate-200 py-3 pl-4 pr-11 outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <button
            type="button"
            onClick={applyCategorySearch}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            {m.admin.search}
          </button>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <CategoriesSkeleton count={5} />
          ) : filteredCategoryTree.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center font-bold text-slate-500">
              {m.admin.noCategories}
            </div>
          ) : (
            filteredCategoryTree.map((parent) => (
              <CategoryTreeBranch
                key={parent.id}
                node={parent}
                depth={0}
                expandedNodes={expandedParents}
                typeLabels={typeLabels}
                onToggle={(nodeId) => toggleParentExpanded(nodeId)}
                onAddChild={startAddChild}
                onEdit={startEdit}
                onDelete={deleteCategory}
                onManageFilters={openFiltersModal}
                labels={{
                  subcategories: m.admin.subcategories,
                  noSubcategories: m.admin.noSubcategories,
                  addSubcategory: m.admin.addSubcategory,
                  editCategory: m.admin.editCategory,
                  deleteCategory: m.admin.deleteCategory,
                  manageFilters: m.admin.manageFilters,
                  adsCount: m.admin.adsCount,
                  active: m.admin.active,
                  inactive: m.admin.inactive
                }}
              />
            ))
          )}
        </div>
      </section>

      {isFormModalOpen ? (
        <CategoryFormModal title={formTitle} onClose={resetForm}>
          {Object.keys(formErrors).length > 0 ? (
            <div className="mb-4 rounded-xl bg-amber-50 p-4 text-sm font-bold text-amber-800">{m.admin.categoryFormError}</div>
          ) : null}

          {formMode === 'edit' && form.parentId ? (
            <p className="mb-4 text-sm text-slate-500">
              {m.admin.subcategoryOf}: {lockedParentName}
            </p>
          ) : null}
          {formMode === 'create-parent' ? <p className="mb-4 text-sm text-slate-500">{m.admin.mainCategory}</p> : null}
          {formMode === 'create-child' ? (
            <p className="mb-4 text-sm font-bold text-brand-700">
              {m.admin.subcategoryOf}: {lockedParentName}
            </p>
          ) : null}

          <form onSubmit={submit} className="grid gap-4 lg:grid-cols-2">
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
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 pe-12 outline-none focus:ring-2 focus:ring-brand-500"
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
              <input
                type="text"
                maxLength={8}
                value={isCategoryEmojiIcon(form.icon) ? form.icon : ''}
                onChange={(event) => {
                  const next = event.target.value.trim();
                  setForm((current) => ({ ...current, icon: next }));
                }}
                placeholder={m.admin.emojiIconPlaceholder}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
              />
              <p className="mt-1 text-xs text-slate-500">{m.admin.emojiIconHint}</p>
            </Field>

            <Field label={m.admin.adType}>
              <select
                value={form.type}
                disabled={formMode === 'create-child'}
                onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as CategoryType }))}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-100"
              >
                {categoryTypes.map((type) => (
                  <option key={type} value={type}>
                    {typeLabels[type]}
                  </option>
                ))}
              </select>
            </Field>

            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 lg:col-span-2">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
              />
              {m.admin.isActive}
            </label>

            <div className="flex flex-wrap gap-3 lg:col-span-2">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 font-bold text-white transition hover:bg-brand-700 disabled:opacity-60"
              >
                <Plus size={18} />
                {editingId ? m.admin.updateCategory : formMode === 'create-child' ? m.admin.addSubcategory : m.admin.createCategory}
              </button>
              <button type="button" onClick={resetForm} className="rounded-xl border border-slate-200 px-5 py-3 font-bold text-slate-700">
                {m.admin.cancel}
              </button>
            </div>
          </form>
        </CategoryFormModal>
      ) : null}

      {isFiltersModalOpen && filtersCategory ? (
        <CategoryFormModal
          title={`${m.admin.categoryFiltersTitle}: ${filtersCategory.nameAr}`}
          onClose={closeFiltersModal}
        >
          <p className="mb-4 text-sm text-slate-500">{m.admin.categoryFiltersHint}</p>

          <div className="mb-5 grid gap-4 lg:grid-cols-2">
            <input
              value={filterTitleAr}
              onChange={(event) => setFilterTitleAr(event.target.value)}
              placeholder={m.admin.filterTitleArPlaceholder}
              className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
            />
            <input
              dir="ltr"
              value={filterTitleEn}
              onChange={(event) => setFilterTitleEn(event.target.value)}
              placeholder={m.admin.filterTitleEnPlaceholder}
              className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
            />
            <div className="space-y-3 lg:col-span-2">
              <p className="text-sm font-bold text-slate-700">{m.admin.filterOptionsLabel}</p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  value={draftOptionAr}
                  onChange={(event) => setDraftOptionAr(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      addPendingFilterOption();
                    }
                  }}
                  placeholder={m.admin.filterOptionArPlaceholder}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500 sm:flex-1"
                />
                <input
                  dir="ltr"
                  value={draftOptionEn}
                  onChange={(event) => setDraftOptionEn(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      addPendingFilterOption();
                    }
                  }}
                  placeholder={m.admin.filterOptionEnPlaceholder}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500 sm:flex-1"
                />
                <button
                  type="button"
                  onClick={addPendingFilterOption}
                  disabled={!draftOptionAr.trim() || !draftOptionEn.trim()}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-bold text-brand-700 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus size={16} />
                  {m.admin.addFilterOption}
                </button>
              </div>
              {pendingFilterOptions.length > 0 ? (
                <div className="flex flex-wrap gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3">
                  {pendingFilterOptions.map((option, index) => (
                    <span
                      key={`${option.labelAr}-${option.labelEn}-${index}`}
                      className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm text-slate-700 ring-1 ring-slate-200"
                    >
                      <span>
                        {option.labelAr} / {option.labelEn}
                      </span>
                      <button
                        type="button"
                        onClick={() => removePendingFilterOption(index)}
                        className="rounded-full p-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-red-600"
                        aria-label={m.admin.deleteFilter}
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2 lg:col-span-2">
              <button
                type="button"
                disabled={filtersSaving || pendingFilterOptions.length === 0}
                onClick={() => void saveFilter()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 font-bold text-white transition hover:bg-brand-700 disabled:opacity-60"
              >
                <Plus size={18} />
                {editingFilterId ? m.admin.updateCategoryFilter : m.admin.addCategoryFilter}
              </button>
              {editingFilterId ? (
                <button
                  type="button"
                  onClick={resetFilterForm}
                  className="rounded-xl border border-slate-200 px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  {m.admin.cancel}
                </button>
              ) : null}
            </div>
          </div>

          {filtersLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <div className="mb-3 h-4 w-40 animate-pulse rounded-full bg-slate-200" />
                  <div className="flex flex-wrap gap-2">
                    <div className="h-7 w-20 animate-pulse rounded-full bg-slate-200" />
                    <div className="h-7 w-24 animate-pulse rounded-full bg-slate-200" />
                  </div>
                </div>
              ))}
            </div>
          ) : categoryFilters.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm font-bold text-slate-500">
              {m.admin.noCategoryFilters}
            </p>
          ) : (
            <div className="admin-content-scrollbar max-h-80 space-y-3 overflow-y-auto">
              {categoryFilters.map((filter) => (
                <div key={filter.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-black text-slate-900">{filter.titleAr}</p>
                      <p className="text-sm text-slate-500">{filter.titleEn}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={filtersSaving}
                        onClick={() => startEditFilter(filter)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
                      >
                        <Edit3 size={14} />
                        {m.admin.editFilter}
                      </button>
                      <button
                        type="button"
                        disabled={filtersSaving}
                        onClick={() => void deleteFilter(filter.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-100 bg-white px-3 py-2 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                      >
                        <Trash2 size={14} />
                        {m.admin.deleteFilter}
                      </button>
                    </div>
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
          )}
        </CategoryFormModal>
      ) : null}
    </div>
  );
}

function CategoryFormModal({ children, onClose, title }: { children: ReactNode; onClose: () => void; title: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mounted, onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="category-form-modal-title"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-slate-200"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 -mx-6 mb-5 flex items-start justify-between gap-4 border-b border-slate-100 bg-white px-6 pb-4 pt-1">
          <div className="min-w-0">
            <h2 id="category-form-modal-title" className="text-xl font-black text-slate-900 md:text-2xl">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}

type CategoryTreeBranchProps = {
  node: CategoryTreeNode<ManagedCategory>;
  depth: number;
  expandedNodes: Record<string, boolean>;
  typeLabels: Record<CategoryType, string>;
  onToggle: (nodeId: string) => void;
  onAddChild: (category: ManagedCategory) => void;
  onEdit: (category: ManagedCategory) => void;
  onDelete: (categoryId: string) => void;
  onManageFilters: (category: ManagedCategory) => void;
  labels: {
    subcategories: string;
    noSubcategories: string;
    addSubcategory: string;
    editCategory: string;
    deleteCategory: string;
    manageFilters: string;
    adsCount: string;
    active: string;
    inactive: string;
  };
};

function CategoryTreeBranch({
  node,
  depth,
  expandedNodes,
  typeLabels,
  onToggle,
  onAddChild,
  onEdit,
  onDelete,
  onManageFilters,
  labels
}: CategoryTreeBranchProps) {
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedNodes[node.id] !== false;
  const isRoot = depth === 0;

  return (
    <div className={isRoot ? 'overflow-hidden rounded-2xl border border-slate-200 bg-white' : undefined}>
      <CategoryTreeRow
        category={node}
        depth={depth}
        typeLabels={typeLabels}
        onEdit={onEdit}
        onDelete={onDelete}
        onManageFilters={() => onManageFilters(node)}
        onAddChild={() => onAddChild(node)}
        onToggle={hasChildren ? () => onToggle(node.id) : undefined}
        isExpanded={isExpanded}
        showExpandToggle={hasChildren}
        labels={labels}
      />

      {isExpanded ? (
        <div className={isRoot ? 'border-t border-slate-100 bg-slate-50/60' : undefined}>
          {hasChildren ? (
            <div
              className={
                isRoot
                  ? 'relative ms-11 border-s-2 border-slate-300 ps-4 md:ms-14 md:ps-5'
                  : 'relative ms-6 border-s-2 border-slate-300/80 ps-4'
              }
            >
              {node.children.map((child) => (
                <CategoryTreeBranch
                  key={child.id}
                  node={child}
                  depth={depth + 1}
                  expandedNodes={expandedNodes}
                  typeLabels={typeLabels}
                  onToggle={onToggle}
                  onAddChild={onAddChild}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onManageFilters={onManageFilters}
                  labels={labels}
                />
              ))}
            </div>
          ) : isRoot ? (
            <p className="px-4 py-4 text-sm font-bold text-slate-400">{labels.noSubcategories}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

type CategoryTreeRowProps = {
  category: ManagedCategory;
  depth: number;
  typeLabels: Record<CategoryType, string>;
  onEdit: (category: ManagedCategory) => void;
  onDelete: (categoryId: string) => void;
  onManageFilters?: () => void;
  labels: CategoryTreeBranchProps['labels'];
  onAddChild?: () => void;
  onToggle?: () => void;
  isExpanded?: boolean;
  showExpandToggle?: boolean;
};

function CategoryTreeRow({
  category,
  depth,
  typeLabels,
  onEdit,
  onDelete,
  onManageFilters,
  labels,
  onAddChild,
  onToggle,
  isExpanded,
  showExpandToggle
}: CategoryTreeRowProps) {
  const IconPreview = category.icon && isCategoryIconKey(category.icon) ? iconMap[category.icon] : null;

  return (
    <div className="relative flex flex-col gap-4 border-b border-slate-100 px-4 py-4 last:border-b-0 lg:flex-row lg:items-center lg:justify-between">
      {depth > 0 ? (
        <span
          className="absolute top-1/2 h-px w-3 -translate-y-1/2 bg-slate-300"
          style={{ insetInlineStart: '-0.75rem' }}
          aria-hidden
        />
      ) : null}
      <div className="flex min-w-0 flex-1 items-start gap-3">
        {showExpandToggle ? (
          <button
            type="button"
            onClick={onToggle}
            className="mt-1 rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100"
            aria-expanded={isExpanded}
          >
            {isExpanded ? <ChevronDown size={18} /> : <ChevronLeft size={18} className="-rotate-90" />}
          </button>
        ) : (
          <span className="mt-1 w-10 shrink-0" />
        )}

        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          {IconPreview ? <IconPreview size={20} /> : <CategoryIcon icon={category.icon} size={20} />}
        </span>

        <div className="min-w-0">
          <p className="font-black text-slate-900">{category.nameAr}</p>
          <p className="text-sm text-slate-500">{category.nameEn}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{typeLabels[category.type]}</span>
            <span className="text-xs font-bold text-slate-500">
              {labels.adsCount}: {category._count?.ads ?? 0}
            </span>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                category.isActive ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {category.isActive ? labels.active : labels.inactive}
            </span>
          </div>
          {category.filters && category.filters.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {category.filters.map((filter) => (
                <span key={filter.id} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-100">
                  {filter.titleAr}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 lg:justify-end">
        {onAddChild ? (
          <button
            type="button"
            onClick={onAddChild}
            className="inline-flex items-center gap-1 rounded-lg border border-brand-100 bg-brand-50 px-3 py-2 text-sm font-bold text-brand-700 transition hover:bg-brand-100"
          >
            <Plus size={14} />
            {labels.addSubcategory}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onManageFilters}
          className="inline-flex items-center gap-1 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
        >
          <Filter size={14} />
          {labels.manageFilters}
        </button>
        <button
          type="button"
          onClick={() => onEdit(category)}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-white"
        >
          <Edit3 size={14} />
          {labels.editCategory}
        </button>
        <button
          type="button"
          onClick={() => onDelete(category.id)}
          className="inline-flex items-center gap-1 rounded-lg border border-red-100 px-3 py-2 text-sm font-bold text-red-600 transition hover:bg-red-50"
        >
          <Trash2 size={14} />
          {labels.deleteCategory}
        </button>
      </div>
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
  onChange: (icon: string) => void;
  value: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = value && isCategoryIconKey(value) ? iconOptions.find((option) => option.key === value) : undefined;
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
          ) : isCategoryEmojiIcon(value) ? (
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-lg">{value}</span>
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
        <div className="absolute z-[120] mt-2 grid max-h-80 w-full grid-cols-6 gap-2 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-xl sm:grid-cols-8">
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
