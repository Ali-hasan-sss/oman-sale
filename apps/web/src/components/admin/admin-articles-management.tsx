'use client';

import { Edit3, Plus, Trash2, X } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';

import { ImageUploader } from '@/components/media/image-uploader';
import { RichTextEditor } from '@/components/admin/rich-text-editor';
import { adminApi } from '@/lib/admin-auth';
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
  const [error, setError] = useState('');
  const formRef = useRef<HTMLFormElement | null>(null);

  const scrollToForm = () => {
    window.setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  };

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [categoriesRes, articlesRes] = await Promise.all([
        adminApi().get<{ data: ArticleCategory[] }>('/admin/article-categories', { params: { includeInactive: true } }),
        adminApi().get<{ data: { items: Article[] } }>('/admin/articles', { params: { page: 1, limit: 50 } })
      ]);
      setCategories(categoriesRes.data.data);
      setArticles(articlesRes.data.data.items);
    } catch {
      setError(m.admin.articlesLoadError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const openCreateArticle = () => {
    setEditingArticleId(null);
    setArticleForm({
      ...emptyArticleForm,
      categoryId: categories[0]?.id ?? ''
    });
    setShowArticleForm(true);
    scrollToForm();
  };

  const openEditArticle = (item: Article) => {
    setEditingArticleId(item.id);
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

  const saveArticle = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      if (editingArticleId) await adminApi().patch(`/admin/articles/${editingArticleId}`, articleForm);
      else await adminApi().post('/admin/articles', articleForm);
      setShowArticleForm(false);
      setEditingArticleId(null);
      await load();
    } catch {
      setError(m.admin.articlesSaveError);
    }
  };

  const removeArticle = async (item: Article) => {
    if (!window.confirm(m.admin.articlesDeleteConfirm)) return;
    await adminApi().delete(`/admin/articles/${item.id}`);
    await load();
  };

  const openCreateCategory = () => {
    setEditingCategoryId(null);
    setCategoryForm({ ...emptyCategoryForm, sortOrder: categories.length });
    setShowCategoryForm(true);
  };

  const openEditCategory = (item: ArticleCategory) => {
    setEditingCategoryId(item.id);
    setCategoryForm({ ...item });
    setShowCategoryForm(true);
  };

  const saveCategory = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      if (editingCategoryId) await adminApi().patch(`/admin/article-categories/${editingCategoryId}`, categoryForm);
      else await adminApi().post('/admin/article-categories', categoryForm);
      setShowCategoryForm(false);
      setEditingCategoryId(null);
      await load();
    } catch {
      setError(m.admin.articlesCategorySaveError);
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

        {showCategoryForm ? (
          <form onSubmit={saveCategory} className="mb-4 rounded-2xl border border-slate-200 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-black">{editingCategoryId ? m.admin.updateArticleCategory : m.admin.createArticleCategory}</h3>
              <button type="button" onClick={() => setShowCategoryForm(false)} className="rounded-full p-2 hover:bg-slate-100"><X size={18} /></button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Input label="Slug" value={categoryForm.slug} onChange={(slug) => setCategoryForm({ ...categoryForm, slug })} />
              <Input label={m.admin.sortOrder} type="number" value={String(categoryForm.sortOrder)} onChange={(sortOrder) => setCategoryForm({ ...categoryForm, sortOrder: Number(sortOrder) })} />
              <Input label={m.admin.nameAr} value={categoryForm.nameAr} onChange={(nameAr) => setCategoryForm({ ...categoryForm, nameAr })} />
              <Input label={m.admin.nameEn} value={categoryForm.nameEn} onChange={(nameEn) => setCategoryForm({ ...categoryForm, nameEn })} />
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

        {error ? <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p> : null}

        {showArticleForm ? (
          <form ref={formRef} onSubmit={saveArticle} className="scroll-mt-24 mb-6 rounded-2xl border border-slate-200 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-black">{editingArticleId ? m.admin.updateArticle : m.admin.createArticle}</h3>
              <button type="button" onClick={() => setShowArticleForm(false)} className="rounded-full p-2 hover:bg-slate-100"><X size={18} /></button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Slug" value={articleForm.slug} onChange={(slug) => setArticleForm({ ...articleForm, slug })} />
              <label className="block">
                <span className="mb-1 block text-sm font-bold text-slate-700">{m.admin.articleCategory}</span>
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
              </label>
              <Input label={m.admin.nameAr} value={articleForm.titleAr} onChange={(titleAr) => setArticleForm({ ...articleForm, titleAr })} wide />
              <Input label={m.admin.nameEn} value={articleForm.titleEn} onChange={(titleEn) => setArticleForm({ ...articleForm, titleEn })} wide />
              <div className="md:col-span-2">
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
              <div className="md:col-span-2">
                <RichTextEditor label={m.admin.articleBodyAr} value={articleForm.bodyAr} onChange={(bodyAr) => setArticleForm({ ...articleForm, bodyAr })} />
              </div>
              <div className="md:col-span-2">
                <RichTextEditor label={m.admin.articleBodyEn} value={articleForm.bodyEn} onChange={(bodyEn) => setArticleForm({ ...articleForm, bodyEn })} />
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

function Input({ label, onChange, type = 'text', value, wide = false }: { label: string; onChange: (value: string) => void; type?: string; value: string; wide?: boolean }) {
  return (
    <label className={`block ${wide ? 'md:col-span-2' : ''}`}>
      <span className="mb-1 block text-sm font-bold text-slate-700">{label}</span>
      <input value={value} type={type} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
    </label>
  );
}
