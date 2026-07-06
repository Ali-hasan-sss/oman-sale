'use client';

import { Check, Edit3, Plus, Trash2, X } from 'lucide-react';
import { FormEvent, ReactNode, useEffect, useRef, useState } from 'react';

import { ImageUploader } from '@/components/media/image-uploader';
import { RichTextEditor } from '@/components/admin/rich-text-editor';
import { adminApi } from '@/lib/admin-auth';
import { getValidationFieldErrors, resolveApiErrorMessage } from '@/lib/api-errors';
import { useI18n } from '@/lib/i18n';
import { resolveMediaUrl } from '@/lib/media-url';

type ArticleCategory = {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  sortOrder: number;
  isActive: boolean;
};

type Article = {
  id: string;
  slug: string;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  coverImageUrl: string;
  galleryImages: string[];
  categoryId: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  publishedAt?: string | null;
  views: number;
  category?: ArticleCategory;
};

type ArticleForm = {
  slug: string;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  coverImageUrl: string;
  galleryImages: string[];
  categoryId: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
};

type CategoryForm = {
  slug: string;
  nameAr: string;
  nameEn: string;
  sortOrder: number;
  isActive: boolean;
};

type SlugStatus = 'idle' | 'checking' | 'available' | 'unavailable' | 'invalid';
type ArticleFormErrors = Partial<Record<keyof ArticleForm, string>>;
type CategoryFormErrors = Partial<Record<keyof CategoryForm, string>>;

const emptyArticleForm: ArticleForm = {
  slug: '',
  titleAr: '',
  titleEn: '',
  bodyAr: '',
  bodyEn: '',
  coverImageUrl: '',
  galleryImages: [],
  categoryId: '',
  status: 'DRAFT'
};

const emptyCategoryForm: CategoryForm = {
  slug: '',
  nameAr: '',
  nameEn: '',
  sortOrder: 0,
  isActive: true
};

const createSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const articleSlugPattern = /^[a-z0-9-]+$/;
const categorySlugPattern = /^[a-z0-9-]+$/;

const stripHtml = (value: string) => value.replace(/<[^>]*>/g, '').trim();

const articleFieldOrder: (keyof ArticleForm)[] = [
  'slug',
  'categoryId',
  'titleAr',
  'titleEn',
  'coverImageUrl',
  'bodyAr',
  'bodyEn'
];

const categoryFieldOrder: (keyof CategoryForm)[] = ['slug', 'nameAr', 'nameEn', 'sortOrder'];

function scrollToFirstError(container: HTMLElement | null, errors: Record<string, string | undefined>, fieldOrder: string[]) {
  if (!container) return;

  const firstField = fieldOrder.find((field) => errors[field]);
  if (!firstField) return;

  window.setTimeout(() => {
    const target = container.querySelector(`[data-form-field="${firstField}"]`);
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 0);
}

export function AdminArticlesManagement() {
  const { locale, m } = useI18n();
  const [categories, setCategories] = useState<ArticleCategory[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [articleForm, setArticleForm] = useState<ArticleForm>(emptyArticleForm);
  const [categoryForm, setCategoryForm] = useState<CategoryForm>(emptyCategoryForm);
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [showArticleForm, setShowArticleForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [articleError, setArticleError] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [articleFormErrors, setArticleFormErrors] = useState<ArticleFormErrors>({});
  const [categoryFormErrors, setCategoryFormErrors] = useState<CategoryFormErrors>({});
  const [articleSlugStatus, setArticleSlugStatus] = useState<SlugStatus>('idle');
  const [categorySlugStatus, setCategorySlugStatus] = useState<SlugStatus>('idle');
  const formRef = useRef<HTMLFormElement | null>(null);
  const categoryFormRef = useRef<HTMLFormElement | null>(null);

  const validationMessages = {
    VALIDATION_FAILED: m.admin.articlesSaveError,
    generic: m.admin.articlesSaveError,
    requiredField: m.admin.requiredField,
    invalidSlug: m.admin.invalidSlug,
    fieldCoverImageRequired: m.admin.articleCoverRequired,
    fieldCategoryRequired: m.admin.articleCategoryRequired
  };

  const resolvedArticleSlug = articleForm.slug || createSlug(articleForm.titleEn || articleForm.titleAr);
  const resolvedCategorySlug = categoryForm.slug || createSlug(categoryForm.nameEn || categoryForm.nameAr);

  const scrollToForm = () => {
    window.setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  };

  const load = async () => {
    setLoading(true);
    setArticleError('');
    try {
      const [categoriesRes, articlesRes] = await Promise.all([
        adminApi().get<{ data: ArticleCategory[] }>('/admin/article-categories', { params: { includeInactive: true } }),
        adminApi().get<{ data: { items: Article[] } }>('/admin/articles', { params: { page: 1, limit: 50 } })
      ]);
      setCategories(categoriesRes.data.data);
      setArticles(articlesRes.data.data.items);
    } catch {
      setArticleError(m.admin.articlesLoadError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!showCategoryForm || !resolvedCategorySlug) {
      setCategorySlugStatus('idle');
      return;
    }

    if (!categorySlugPattern.test(resolvedCategorySlug)) {
      setCategorySlugStatus('invalid');
      return;
    }

    setCategorySlugStatus('checking');

    const timeoutId = window.setTimeout(() => {
      adminApi()
        .get<{ data: { available: boolean } }>('/admin/article-categories/slug-availability', {
          params: {
            slug: resolvedCategorySlug,
            excludeId: editingCategoryId
          }
        })
        .then((response) => setCategorySlugStatus(response.data.data.available ? 'available' : 'unavailable'))
        .catch(() => setCategorySlugStatus('idle'));
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [editingCategoryId, resolvedCategorySlug, showCategoryForm]);

  useEffect(() => {
    if (!showArticleForm || !resolvedArticleSlug) {
      setArticleSlugStatus('idle');
      return;
    }

    if (!articleSlugPattern.test(resolvedArticleSlug)) {
      setArticleSlugStatus('invalid');
      return;
    }

    setArticleSlugStatus('checking');

    const timeoutId = window.setTimeout(() => {
      adminApi()
        .get<{ data: { available: boolean } }>('/admin/articles/slug-availability', {
          params: {
            slug: resolvedArticleSlug,
            excludeId: editingArticleId
          }
        })
        .then((response) => setArticleSlugStatus(response.data.data.available ? 'available' : 'unavailable'))
        .catch(() => setArticleSlugStatus('idle'));
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [editingArticleId, resolvedArticleSlug, showArticleForm]);

  const openCreateArticle = () => {
    setEditingArticleId(null);
    setArticleFormErrors({});
    setArticleError('');
    setArticleForm({
      ...emptyArticleForm,
      categoryId: categories[0]?.id ?? ''
    });
    setShowArticleForm(true);
    scrollToForm();
  };

  const openEditArticle = (item: Article) => {
    setEditingArticleId(item.id);
    setArticleFormErrors({});
    setArticleError('');
    setArticleForm({
      slug: item.slug,
      titleAr: item.titleAr,
      titleEn: item.titleEn,
      bodyAr: item.bodyAr,
      bodyEn: item.bodyEn,
      coverImageUrl: item.coverImageUrl,
      galleryImages: item.galleryImages ?? [],
      categoryId: item.categoryId,
      status: item.status
    });
    setShowArticleForm(true);
    scrollToForm();
  };

  const validateArticleForm = () => {
    const nextErrors: ArticleFormErrors = {};
    if (!articleForm.titleAr.trim()) nextErrors.titleAr = m.admin.requiredField;
    if (!articleForm.titleEn.trim()) nextErrors.titleEn = m.admin.requiredField;
    if (!stripHtml(articleForm.bodyAr)) nextErrors.bodyAr = m.admin.requiredField;
    if (!stripHtml(articleForm.bodyEn)) nextErrors.bodyEn = m.admin.requiredField;
    if (!articleForm.categoryId) nextErrors.categoryId = m.admin.articleCategoryRequired;
    if (!articleForm.coverImageUrl.trim()) nextErrors.coverImageUrl = m.admin.articleCoverRequired;
    if (!resolvedArticleSlug || !articleSlugPattern.test(resolvedArticleSlug)) nextErrors.slug = m.admin.invalidSlug;
    if (articleSlugStatus === 'checking') nextErrors.slug = m.admin.slugChecking;
    if (articleSlugStatus === 'unavailable') nextErrors.slug = m.admin.slugUnavailable;

    setArticleFormErrors(nextErrors);
    return nextErrors;
  };

  const saveArticle = async (event: FormEvent) => {
    event.preventDefault();
    setArticleError('');
    const errors = validateArticleForm();
    if (Object.keys(errors).length > 0) {
      scrollToFirstError(formRef.current, errors, articleFieldOrder);
      return;
    }

    const payload = {
      ...articleForm,
      slug: articleForm.slug || createSlug(articleForm.titleEn || articleForm.titleAr)
    };

    try {
      if (editingArticleId) await adminApi().patch(`/admin/articles/${editingArticleId}`, payload);
      else await adminApi().post('/admin/articles', payload);
      setShowArticleForm(false);
      setEditingArticleId(null);
      setArticleFormErrors({});
      await load();
    } catch (caught) {
      const fieldErrors = getValidationFieldErrors(caught, validationMessages);
      if (Object.keys(fieldErrors).length > 0) {
        setArticleFormErrors(fieldErrors as ArticleFormErrors);
        scrollToFirstError(formRef.current, fieldErrors, articleFieldOrder);
      }
      setArticleError(resolveApiErrorMessage(caught, validationMessages, m.admin.articlesSaveError));
    }
  };

  const removeArticle = async (item: Article) => {
    if (!window.confirm(m.admin.articlesDeleteConfirm)) return;
    await adminApi().delete(`/admin/articles/${item.id}`);
    await load();
  };

  const openCreateCategory = () => {
    setEditingCategoryId(null);
    setCategoryFormErrors({});
    setCategoryError('');
    setCategoryForm({ ...emptyCategoryForm, sortOrder: categories.length });
    setShowCategoryForm(true);
  };

  const openEditCategory = (item: ArticleCategory) => {
    setEditingCategoryId(item.id);
    setCategoryFormErrors({});
    setCategoryError('');
    setCategoryForm({ ...item });
    setShowCategoryForm(true);
  };

  const validateCategoryForm = () => {
    const nextErrors: CategoryFormErrors = {};
    if (!categoryForm.nameAr.trim()) nextErrors.nameAr = m.admin.requiredField;
    if (!categoryForm.nameEn.trim()) nextErrors.nameEn = m.admin.requiredField;
    if (!resolvedCategorySlug || !categorySlugPattern.test(resolvedCategorySlug)) nextErrors.slug = m.admin.invalidSlug;
    if (categorySlugStatus === 'checking') nextErrors.slug = m.admin.slugChecking;
    if (categorySlugStatus === 'unavailable') nextErrors.slug = m.admin.slugUnavailable;

    setCategoryFormErrors(nextErrors);
    return nextErrors;
  };

  const saveCategory = async (event: FormEvent) => {
    event.preventDefault();
    setCategoryError('');
    const errors = validateCategoryForm();
    if (Object.keys(errors).length > 0) {
      scrollToFirstError(categoryFormRef.current, errors, categoryFieldOrder);
      return;
    }

    const payload = {
      ...categoryForm,
      slug: categoryForm.slug || createSlug(categoryForm.nameEn || categoryForm.nameAr)
    };

    try {
      if (editingCategoryId) await adminApi().patch(`/admin/article-categories/${editingCategoryId}`, payload);
      else await adminApi().post('/admin/article-categories', payload);
      setShowCategoryForm(false);
      setEditingCategoryId(null);
      setCategoryFormErrors({});
      await load();
    } catch (caught) {
      const fieldErrors = getValidationFieldErrors(caught, validationMessages);
      if (Object.keys(fieldErrors).length > 0) {
        setCategoryFormErrors(fieldErrors as CategoryFormErrors);
        scrollToFirstError(categoryFormRef.current, fieldErrors, categoryFieldOrder);
      }
      setCategoryError(resolveApiErrorMessage(caught, validationMessages, m.admin.articlesCategorySaveError));
    }
  };

  const removeCategory = async (item: ArticleCategory) => {
    if (!window.confirm(m.admin.articlesCategoryDeleteConfirm)) return;
    await adminApi().delete(`/admin/article-categories/${item.id}`);
    await load();
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900">{m.admin.articlesCategoriesTitle}</h2>
            <p className="mt-1 text-sm text-slate-500">{m.admin.articlesCategoriesHint}</p>
          </div>
          <button
            type="button"
            onClick={openCreateCategory}
            disabled={categories.length >= 10 && !editingCategoryId}
            className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-bold text-brand-700 disabled:opacity-50"
          >
            <Plus size={18} />
            {m.admin.createArticleCategory}
          </button>
        </div>

        {categoryError ? <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{categoryError}</p> : null}

        {showCategoryForm ? (
          <form ref={categoryFormRef} onSubmit={saveCategory} className="scroll-mt-24 mb-4 rounded-2xl border border-slate-200 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-black">{editingCategoryId ? m.admin.updateArticleCategory : m.admin.createArticleCategory}</h3>
              <button type="button" onClick={() => setShowCategoryForm(false)} className="rounded-full p-2 hover:bg-slate-100"><X size={18} /></button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <SlugField
                error={categoryFormErrors.slug}
                fieldName="slug"
                label={m.admin.slug}
                onChange={(slug) => setCategoryForm({ ...categoryForm, slug })}
                placeholder={createSlug(categoryForm.nameEn || categoryForm.nameAr)}
                slugStatus={categorySlugStatus}
                value={categoryForm.slug}
              />
              <Field error={categoryFormErrors.sortOrder} fieldName="sortOrder" label={m.admin.sortOrder}>
                <input
                  type="number"
                  value={String(categoryForm.sortOrder)}
                  onChange={(event) => setCategoryForm({ ...categoryForm, sortOrder: Number(event.target.value) })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </Field>
              <Field error={categoryFormErrors.nameAr} fieldName="nameAr" label={m.admin.nameAr}>
                <input
                  value={categoryForm.nameAr}
                  onChange={(event) => setCategoryForm({ ...categoryForm, nameAr: event.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </Field>
              <Field error={categoryFormErrors.nameEn} fieldName="nameEn" label={m.admin.nameEn}>
                <input
                  dir="ltr"
                  value={categoryForm.nameEn}
                  onChange={(event) => setCategoryForm({ ...categoryForm, nameEn: event.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </Field>
              <label className="flex items-center gap-2 font-bold text-slate-700">
                <input type="checkbox" checked={categoryForm.isActive} onChange={(event) => setCategoryForm({ ...categoryForm, isActive: event.target.checked })} />
                {m.admin.isActive}
              </label>
            </div>
            <button className="mt-4 rounded-xl bg-brand-600 px-4 py-2 font-bold text-white">{m.admin.save}</button>
          </form>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <div key={category.id} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-sm">
              <span className="font-bold">{locale === 'en' ? category.nameEn : category.nameAr}</span>
              <button type="button" onClick={() => openEditCategory(category)} className="text-slate-500 hover:text-brand-600"><Edit3 size={14} /></button>
              <button type="button" onClick={() => void removeCategory(category)} className="text-slate-500 hover:text-red-600"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900">{m.admin.articlesManagement}</h2>
            <p className="mt-1 text-sm text-slate-500">{m.admin.articlesManagementHint}</p>
          </div>
          <button type="button" onClick={openCreateArticle} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white">
            <Plus size={18} />
            {m.admin.createArticle}
          </button>
        </div>

        {articleError ? <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{articleError}</p> : null}

        {showArticleForm ? (
          <form ref={formRef} onSubmit={saveArticle} className="scroll-mt-24 mb-6 rounded-2xl border border-slate-200 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-black">{editingArticleId ? m.admin.updateArticle : m.admin.createArticle}</h3>
              <button type="button" onClick={() => setShowArticleForm(false)} className="rounded-full p-2 hover:bg-slate-100"><X size={18} /></button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <SlugField
                error={articleFormErrors.slug}
                fieldName="slug"
                label={m.admin.slug}
                onChange={(slug) => setArticleForm({ ...articleForm, slug })}
                placeholder={createSlug(articleForm.titleEn || articleForm.titleAr)}
                slugStatus={articleSlugStatus}
                value={articleForm.slug}
              />
              <Field error={articleFormErrors.categoryId} fieldName="categoryId" label={m.admin.articleCategory}>
                <select
                  value={articleForm.categoryId}
                  onChange={(event) => setArticleForm({ ...articleForm, categoryId: event.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="">{m.admin.selectCategory}</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {locale === 'en' ? category.nameEn : category.nameAr}
                    </option>
                  ))}
                </select>
              </Field>
              <Field error={articleFormErrors.titleAr} fieldName="titleAr" label={m.admin.nameAr} wide>
                <input
                  value={articleForm.titleAr}
                  onChange={(event) => setArticleForm({ ...articleForm, titleAr: event.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </Field>
              <Field error={articleFormErrors.titleEn} fieldName="titleEn" label={m.admin.nameEn} wide>
                <input
                  dir="ltr"
                  value={articleForm.titleEn}
                  onChange={(event) => setArticleForm({ ...articleForm, titleEn: event.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </Field>
              <div className="md:col-span-2" data-form-field="coverImageUrl">
                <ImageUploader
                  folder="articles"
                  useAdminAuth
                  value={articleForm.coverImageUrl}
                  onChange={(coverImageUrl) => setArticleForm({ ...articleForm, coverImageUrl })}
                  labels={{
                    title: m.admin.articleCoverTitle,
                    hint: m.admin.articleCoverHint,
                    remove: m.admin.removeImage,
                    uploading: m.admin.tourismImageUploading,
                    compressing: m.admin.tourismImageCompressing,
                    uploadError: m.admin.tourismImageUploadError
                  }}
                />
                {articleFormErrors.coverImageUrl ? (
                  <p className="mt-1 text-xs font-bold text-red-600">{articleFormErrors.coverImageUrl}</p>
                ) : null}
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-bold text-slate-700">{m.admin.articleGalleryTitle}</label>
                <ImageUploader
                  folder="articles"
                  useAdminAuth
                  multiple
                  maxFiles={12}
                  value={articleForm.galleryImages}
                  onChange={(galleryImages) => setArticleForm({ ...articleForm, galleryImages })}
                  labels={{
                    title: m.admin.articleGalleryUploadTitle,
                    hint: m.admin.articleGalleryUploadHint,
                    remove: m.admin.removeImage,
                    uploading: m.admin.tourismImageUploading,
                    compressing: m.admin.tourismImageCompressing,
                    uploadError: m.admin.tourismImageUploadError
                  }}
                />
              </div>
              <div className="md:col-span-2" data-form-field="bodyAr">
                <RichTextEditor label={m.admin.articleBodyAr} value={articleForm.bodyAr} onChange={(bodyAr) => setArticleForm({ ...articleForm, bodyAr })} />
                {articleFormErrors.bodyAr ? <p className="mt-1 text-xs font-bold text-red-600">{articleFormErrors.bodyAr}</p> : null}
              </div>
              <div className="md:col-span-2" data-form-field="bodyEn">
                <RichTextEditor label={m.admin.articleBodyEn} value={articleForm.bodyEn} onChange={(bodyEn) => setArticleForm({ ...articleForm, bodyEn })} />
                {articleFormErrors.bodyEn ? <p className="mt-1 text-xs font-bold text-red-600">{articleFormErrors.bodyEn}</p> : null}
              </div>
              <label className="block">
                <span className="mb-1 block text-sm font-bold text-slate-700">{m.admin.articleStatus}</span>
                <select
                  value={articleForm.status}
                  onChange={(event) => setArticleForm({ ...articleForm, status: event.target.value as ArticleForm['status'] })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="DRAFT">{m.admin.articleStatusDraft}</option>
                  <option value="PUBLISHED">{m.admin.articleStatusPublished}</option>
                  <option value="ARCHIVED">{m.admin.articleStatusArchived}</option>
                </select>
              </label>
            </div>
            <button className="mt-5 rounded-xl bg-brand-600 px-5 py-2.5 font-bold text-white">{m.admin.save}</button>
          </form>
        ) : null}

        {loading ? (
          <p className="text-slate-500">{m.admin.loading}</p>
        ) : (
          <div className="grid gap-4">
            {articles.map((item) => (
              <article key={item.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-4 md:flex-row">
                <img src={resolveMediaUrl(item.coverImageUrl)} alt={item.titleAr} className="h-28 w-full rounded-xl object-cover md:w-44" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-black text-slate-900">{locale === 'en' ? item.titleEn : item.titleAr}</h3>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">{item.status}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500" dir="ltr">/{item.slug}</p>
                  <p className="mt-1 text-xs text-brand-700">
                    {locale === 'en' ? item.category?.nameEn : item.category?.nameAr} · {item.views} {m.admin.articleViews}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => openEditArticle(item)} className="rounded-lg border border-slate-200 p-2 text-slate-600"><Edit3 size={18} /></button>
                  <button type="button" onClick={() => void removeArticle(item)} className="rounded-lg border border-red-200 p-2 text-red-600"><Trash2 size={18} /></button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Field({
  children,
  error,
  fieldName,
  label,
  wide = false
}: {
  children: ReactNode;
  error?: string;
  fieldName?: string;
  label: string;
  wide?: boolean;
}) {
  return (
    <label data-form-field={fieldName} className={`block ${wide ? 'md:col-span-2' : ''}`}>
      <span className="mb-1 block text-sm font-bold text-slate-700">{label}</span>
      {children}
      {error ? <p className="mt-1 text-xs font-bold text-red-600">{error}</p> : null}
    </label>
  );
}

function SlugField({
  error,
  fieldName = 'slug',
  label,
  onChange,
  placeholder,
  slugStatus,
  value
}: {
  error?: string;
  fieldName?: string;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  slugStatus: SlugStatus;
  value: string;
}) {
  const { m } = useI18n();

  return (
    <Field error={error} fieldName={fieldName} label={label}>
      <div className="relative">
        <input
          dir="ltr"
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 pe-12 text-sm"
        />
        <SlugStatusIndicator
          availableLabel={m.admin.slugAvailable}
          checkingLabel={m.admin.slugChecking}
          status={slugStatus}
          unavailableLabel={m.admin.slugUnavailable}
        />
      </div>
    </Field>
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

  if (status === 'invalid') {
    return (
      <span title={unavailableLabel} className="absolute inset-y-0 right-3 flex items-center text-red-600">
        <X size={18} />
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
