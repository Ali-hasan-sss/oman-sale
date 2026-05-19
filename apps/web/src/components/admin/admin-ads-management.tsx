'use client';

import { Edit3, ExternalLink, Eye, Plus, Power, PowerOff, RotateCcw, Search, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';

import { adminApi } from '@/lib/admin-auth';
import { useI18n } from '@/lib/i18n';

type AdStatus = 'DRAFT' | 'PENDING' | 'ACTIVE' | 'REJECTED' | 'EXPIRED' | 'ARCHIVED';
type AdType = 'PRODUCT' | 'SERVICE' | 'JOB' | 'JOB_REQUEST' | 'LOGISTICS' | 'CONSTRUCTION';

type Category = {
  id: string;
  name: string;
  nameAr: string;
  nameEn: string;
  type: AdType;
};

type AdminAd = {
  id: string;
  title: string;
  description: string;
  type: AdType;
  price?: string | number | null;
  currency: string;
  city?: string | null;
  area?: string | null;
  contactPhone?: string | null;
  status: AdStatus;
  isApproved: boolean;
  isActive: boolean;
  isSold: boolean;
  views: number;
  createdAt: string;
  deletedAt?: string | null;
  user?: { fullName: string; email: string; phone?: string | null } | null;
  category?: Category | null;
  images?: Array<{ imageUrl: string }>;
  promotion?: {
    startsAt?: string;
    endsAt?: string;
    isActive?: boolean;
    plan?: {
      badgeLabel?: string | null;
      nameAr?: string | null;
      nameEn?: string | null;
      priorityScore?: number | null;
      color?: string | null;
    } | null;
  } | null;
};

type AdsResponse = {
  items: AdminAd[];
  total: number;
  page: number;
  limit: number;
};

type FormState = {
  title: string;
  description: string;
  categoryId: string;
  type: AdType;
  price: string;
  city: string;
  area: string;
  contactPhone: string;
  status: AdStatus;
  isApproved: boolean;
  imageUrls: string;
};

const statuses: AdStatus[] = ['DRAFT', 'PENDING', 'ACTIVE', 'REJECTED', 'EXPIRED', 'ARCHIVED'];
const cities = ['مسقط', 'صلالة', 'صحار', 'نزوى', 'صور', 'البريمي', 'الرستاق', 'السيب', 'الخوير', 'القرم'];
const inputClass = 'w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500';

const initialForm: FormState = {
  title: '',
  description: '',
  categoryId: '',
  type: 'PRODUCT',
  price: '',
  city: 'مسقط',
  area: '',
  contactPhone: '',
  status: 'ACTIVE',
  isApproved: true,
  imageUrls: ''
};

const labels = {
  ar: {
    title: 'إدارة العروض',
    subtitle: 'استعرض وابحث وعدّل كل عروض المنصة',
    add: 'إضافة عرض',
    edit: 'تعديل عرض',
    details: 'تفاصيل العرض',
    search: 'بحث بعنوان أو وصف العرض',
    category: 'الفئة',
    status: 'الحالة',
    all: 'الكل',
    includeDeleted: 'إظهار المحذوفة',
    deletedOnly: 'المحذوفة فقط',
    loading: 'جاري تحميل العروض...',
    noData: 'لا توجد عروض مطابقة.',
    seller: 'المعلن',
    views: 'المشاهدات',
    approved: 'معتمد',
    visibility: 'الظهور',
    sold: 'مباع',
    deleted: 'محذوف',
    promotionScore: 'درجة الترويج',
    noPromotion: 'بدون ترويج',
    location: 'الموقع',
    phone: 'الهاتف',
    createdAt: 'تاريخ الإنشاء',
    price: 'السعر',
    images: 'الصور',
    activate: 'تفعيل',
    deactivate: 'إلغاء التفعيل',
    actions: 'إجراءات',
    save: 'حفظ',
    cancel: 'إلغاء',
    delete: 'حذف',
    restore: 'استعادة',
    view: 'عرض',
    viewOnSite: 'عرض على الموقع',
    confirmDelete: 'هل تريد حذف هذا العرض؟',
    page: 'صفحة',
    of: 'من',
    loadError: 'تعذر تحميل العروض.',
    formError: 'يرجى تعبئة عنوان ووصف وفئة العرض.',
    imagesHint: 'ضع كل رابط صورة في سطر مستقل'
  },
  en: {
    title: 'Ads management',
    subtitle: 'Browse, search and manage every platform listing',
    add: 'Add ad',
    edit: 'Edit ad',
    details: 'Ad details',
    search: 'Search title or description',
    category: 'Category',
    status: 'Status',
    all: 'All',
    includeDeleted: 'Show deleted',
    deletedOnly: 'Deleted only',
    loading: 'Loading ads...',
    noData: 'No matching ads.',
    seller: 'Seller',
    views: 'Views',
    approved: 'Approved',
    visibility: 'Visibility',
    sold: 'Sold',
    deleted: 'Deleted',
    promotionScore: 'Promotion score',
    noPromotion: 'No promotion',
    location: 'Location',
    phone: 'Phone',
    createdAt: 'Created at',
    price: 'Price',
    images: 'Images',
    activate: 'Activate',
    deactivate: 'Deactivate',
    actions: 'Actions',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    restore: 'Restore',
    view: 'View',
    viewOnSite: 'View on site',
    confirmDelete: 'Delete this ad?',
    page: 'Page',
    of: 'of',
    loadError: 'Could not load ads.',
    formError: 'Please fill title, description and category.',
    imagesHint: 'Put each image URL on a separate line'
  }
};

export function AdminAdsManagement() {
  const { locale, localizedPath, m } = useI18n();
  const text = labels[locale];
  const statusLabel = (item: AdStatus) => m.admin.adStatus[item] ?? item;
  const categoryName = (category: Category | null | undefined) => {
    if (!category) return '-';
    if (locale === 'ar') return category.nameAr || category.name || '-';
    return category.nameEn || category.name || '-';
  };
  const promotionName = (ad: AdminAd) => {
    const plan = ad.promotion?.plan;
    if (!plan) return text.noPromotion;
    return plan.badgeLabel || (locale === 'ar' ? plan.nameAr : plan.nameEn) || text.noPromotion;
  };
  const promotionScore = (ad: AdminAd) => ad.promotion?.plan?.priorityScore ?? 0;
  const [ads, setAds] = useState<AdminAd[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState('');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [deletedOnly, setDeletedOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState<FormState>(initialForm);
  const [editingAd, setEditingAd] = useState<AdminAd | null>(null);
  const [viewingAd, setViewingAd] = useState<AdminAd | null>(null);
  const [showForm, setShowForm] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / 20));

  const loadAds = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await adminApi().get<{ data: AdsResponse }>('/admin/ads', {
        params: {
          page,
          limit: 20,
          q: q || undefined,
          categoryId: categoryId || undefined,
          status: status || undefined,
          includeDeleted: includeDeleted || undefined,
          deletedOnly: deletedOnly || undefined
        }
      });
      setAds(response.data.data.items);
      setTotal(response.data.data.total);
    } catch {
      setError(text.loadError);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    adminApi()
      .get<{ data: Category[] }>('/categories', { params: { locale } })
      .then((response) => setCategories(response.data.data))
      .catch(() => setCategories([]));
  }, [locale]);

  useEffect(() => {
    loadAds();
  }, [page, categoryId, status, includeDeleted, deletedOnly]);

  const selectedCategoryType = useMemo(() => categories.find((category) => category.id === form.categoryId)?.type, [categories, form.categoryId]);

  useEffect(() => {
    if (selectedCategoryType) setForm((current) => ({ ...current, type: selectedCategoryType }));
  }, [selectedCategoryType]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingAd(null);
    setShowForm(false);
  };

  const startAdd = () => {
    setForm(initialForm);
    setEditingAd(null);
    setShowForm(true);
  };

  const startEdit = (ad: AdminAd) => {
    setEditingAd(ad);
    setForm({
      title: ad.title,
      description: ad.description,
      categoryId: ad.category?.id ?? '',
      type: ad.type,
      price: ad.price?.toString() ?? '',
      city: ad.city ?? 'مسقط',
      area: ad.area ?? '',
      contactPhone: ad.contactPhone ?? '',
      status: ad.status,
      isApproved: ad.isApproved,
      imageUrls: ad.images?.map((image) => image.imageUrl).join('\n') ?? ''
    });
    setShowForm(true);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.title.trim() || !form.description.trim() || !form.categoryId) {
      setError(text.formError);
      return;
    }

    const payload = {
      title: form.title,
      description: form.description,
      type: form.type,
      price: form.price ? Number(form.price) : undefined,
      currency: 'OMR',
      city: form.city,
      area: form.area || undefined,
      contactPhone: form.contactPhone || undefined,
      status: form.status,
      categoryId: form.categoryId,
      imageUrls: form.imageUrls.split('\n').map((url) => url.trim()).filter(Boolean)
    };

    if (editingAd) {
      await adminApi().patch(`/admin/ads/${editingAd.id}`, payload);
    } else {
      await adminApi().post('/admin/ads', payload);
    }

    resetForm();
    loadAds();
  };

  const deleteAd = async (ad: AdminAd) => {
    if (!window.confirm(text.confirmDelete)) return false;
    await adminApi().delete(`/admin/ads/${ad.id}`);
    loadAds();
    return true;
  };

  const restoreAd = async (ad: AdminAd) => {
    await adminApi().post(`/admin/ads/${ad.id}/restore`);
    loadAds();
  };

  const toggleActive = async (ad: AdminAd) => {
    if (ad.isActive) {
      await adminApi().post(`/admin/ads/${ad.id}/deactivate`);
    } else {
      await adminApi().post(`/admin/ads/${ad.id}/activate`);
    }
    loadAds();
  };

  const applySearch = () => {
    setPage(1);
    loadAds();
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-br from-slate-950 to-brand-900 p-8 text-white shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-black">{text.title}</h1>
            <p className="mt-2 text-white/70">{text.subtitle}</p>
          </div>
          <button onClick={startAdd} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-slate-900 transition hover:bg-slate-100">
            <Plus size={18} />
            {text.add}
          </button>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr_1fr_auto_auto]">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input value={q} onChange={(event) => setQ(event.target.value)} placeholder={text.search} className={`${inputClass} pr-10`} />
          </div>
          <select value={categoryId} onChange={(event) => { setPage(1); setCategoryId(event.target.value); }} className={inputClass}>
            <option value="">{text.category}: {text.all}</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
          <select value={status} onChange={(event) => { setPage(1); setStatus(event.target.value); }} className={inputClass}>
            <option value="">{m.admin.allStatuses}</option>
            {statuses.map((item) => <option key={item} value={item}>{statusLabel(item)}</option>)}
          </select>
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700">
            <input type="checkbox" checked={includeDeleted} onChange={(event) => { setPage(1); setIncludeDeleted(event.target.checked); }} />
            {text.includeDeleted}
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700">
            <input type="checkbox" checked={deletedOnly} onChange={(event) => { setPage(1); setDeletedOnly(event.target.checked); setIncludeDeleted(event.target.checked || includeDeleted); }} />
            {text.deletedOnly}
          </label>
        </div>
        <button onClick={applySearch} className="mt-3 rounded-xl bg-slate-900 px-5 py-2 font-bold text-white transition hover:bg-slate-800">
          {text.search}
        </button>
      </section>

      {showForm ? (
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-black">{editingAd ? text.edit : text.add}</h2>
            <button onClick={resetForm} className="rounded-full p-2 transition hover:bg-slate-100"><X size={18} /></button>
          </div>
          <form onSubmit={submit} className="grid gap-4 lg:grid-cols-2">
            <Field label="Title"><input className={inputClass} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></Field>
            <Field label={text.category}>
              <select className={inputClass} value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })}>
                <option value="">{text.category}</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </Field>
            <Field label={text.status}>
              <select className={inputClass} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as AdStatus })}>
                {statuses.map((item) => <option key={item} value={item}>{statusLabel(item)}</option>)}
              </select>
            </Field>
            <Field label="Price"><input className={inputClass} value={form.price} type="number" onChange={(event) => setForm({ ...form, price: event.target.value })} /></Field>
            <Field label="City">
              <select className={inputClass} value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })}>
                {cities.map((city) => <option key={city} value={city}>{city}</option>)}
              </select>
            </Field>
            <Field label="Area"><input className={inputClass} value={form.area} onChange={(event) => setForm({ ...form, area: event.target.value })} /></Field>
            <Field label="Phone"><input className={inputClass} value={form.contactPhone} onChange={(event) => setForm({ ...form, contactPhone: event.target.value })} /></Field>
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 font-bold text-slate-700">
              <input type="checkbox" checked={form.isApproved} onChange={(event) => setForm({ ...form, isApproved: event.target.checked })} />
              {text.approved}
            </label>
            <div className="lg:col-span-2">
              <Field label="Description"><textarea className={`${inputClass} min-h-32`} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></Field>
            </div>
            <div className="lg:col-span-2">
              <Field label="Images">
                <textarea className={`${inputClass} min-h-24`} value={form.imageUrls} onChange={(event) => setForm({ ...form, imageUrls: event.target.value })} placeholder={text.imagesHint} />
              </Field>
            </div>
            <div className="flex gap-2 lg:col-span-2">
              <button className="rounded-xl bg-brand-600 px-5 py-3 font-bold text-white transition hover:bg-brand-700">{text.save}</button>
              <button type="button" onClick={resetForm} className="rounded-xl border border-slate-200 px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-50">{text.cancel}</button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-3xl bg-white shadow-sm">
        {error ? <p className="border-b border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</p> : null}
        <div>
          <table className="w-full table-fixed text-xs">
            <thead className="bg-slate-50 text-[11px] text-slate-500">
              <tr>
                <th className="w-[42%] px-3 py-2 text-start font-bold">Ad</th>
                <th className="w-[18%] px-3 py-2 text-start font-bold">{text.seller}</th>
                <th className="w-[14%] px-3 py-2 text-start font-bold">{text.status}</th>
                <th className="w-[16%] px-3 py-2 text-start font-bold">{text.promotionScore}</th>
                <th className="w-[10%] px-3 py-2 text-center font-bold">{text.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={5} className="px-2 py-6 text-center font-bold text-slate-500">{text.loading}</td></tr>
              ) : ads.length === 0 ? (
                <tr><td colSpan={5} className="px-2 py-6 text-center font-bold text-slate-500">{text.noData}</td></tr>
              ) : (
                ads.map((ad) => (
                  <tr key={ad.id} className={ad.deletedAt ? 'bg-red-50/40' : undefined}>
                    <td className="px-3 py-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <img src={ad.images?.[0]?.imageUrl ?? '/logo.png'} alt={ad.title} className="h-9 w-11 shrink-0 rounded-lg object-cover" />
                        <div className="min-w-0">
                          <p className="truncate font-bold text-slate-900">{ad.title}</p>
                          <p className="truncate text-[10px] text-slate-500">{categoryName(ad.category)} · {formatPrice(ad.price, ad.currency)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="truncate px-3 py-2 text-slate-600">{ad.user?.fullName ?? '-'}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-col gap-1">
                        <Badge>{statusLabel(ad.status)}</Badge>
                        {ad.isSold ? <Badge variant="sold">{m.admin.soldBadge}</Badge> : null}
                        {ad.deletedAt ? <Badge variant="deleted">{text.deleted}</Badge> : null}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <p className="truncate font-bold text-slate-800">{promotionName(ad)}</p>
                      <p className="text-[10px] font-bold text-brand-700">{promotionScore(ad).toLocaleString(locale === 'ar' ? 'ar-OM' : 'en-US')}</p>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button onClick={() => setViewingAd(ad)} className="inline-flex rounded-md bg-slate-100 p-1.5 text-slate-700 transition hover:bg-slate-200" title={text.view}><Eye size={13} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-4">
          <p className="text-sm font-bold text-slate-500">{text.page} {page} {text.of} {totalPages}</p>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded-xl border border-slate-200 px-4 py-2 font-bold disabled:opacity-50">Prev</button>
            <button disabled={page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} className="rounded-xl border border-slate-200 px-4 py-2 font-bold disabled:opacity-50">Next</button>
          </div>
        </div>
      </section>

      {viewingAd ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-black">{text.details}</h2>
              <button onClick={() => setViewingAd(null)} className="rounded-full p-2 transition hover:bg-slate-100"><X size={18} /></button>
            </div>
            <img src={viewingAd.images?.[0]?.imageUrl ?? '/logo.png'} alt={viewingAd.title} className="mb-4 h-72 w-full rounded-2xl object-cover" />
            <h3 className="text-2xl font-black">{viewingAd.title}</h3>
            <p className="mt-2 font-bold text-brand-600">{formatPrice(viewingAd.price, viewingAd.currency)}</p>
            <p className="mt-4 whitespace-pre-line text-slate-700">{viewingAd.description}</p>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <DetailItem label={text.seller} value={viewingAd.user ? `${viewingAd.user.fullName} (${viewingAd.user.email})` : '-'} />
              <DetailItem label={text.category} value={categoryName(viewingAd.category)} />
              <DetailItem label={text.status} value={statusLabel(viewingAd.status)} />
              <DetailItem label={text.visibility} value={viewingAd.isActive ? m.admin.activeListing : m.admin.inactive} />
              <DetailItem label={text.approved} value={viewingAd.isApproved ? text.approved : m.admin.notApproved} />
              <DetailItem label={text.sold} value={viewingAd.isSold ? text.sold : '-'} />
              <DetailItem label={text.deleted} value={viewingAd.deletedAt ? text.deleted : '-'} />
              <DetailItem label={text.views} value={viewingAd.views.toLocaleString(locale === 'ar' ? 'ar-OM' : 'en-US')} />
              <DetailItem label={text.location} value={[viewingAd.city, viewingAd.area].filter(Boolean).join(' - ') || '-'} />
              <DetailItem label={text.phone} value={viewingAd.contactPhone || viewingAd.user?.phone || '-'} />
              <DetailItem label={text.promotionScore} value={`${promotionName(viewingAd)} · ${promotionScore(viewingAd).toLocaleString(locale === 'ar' ? 'ar-OM' : 'en-US')}`} />
              <DetailItem label={text.createdAt} value={new Intl.DateTimeFormat(locale === 'ar' ? 'ar-OM' : 'en-US').format(new Date(viewingAd.createdAt))} />
            </div>

            {viewingAd.images && viewingAd.images.length > 1 ? (
              <div className="mt-6">
                <p className="mb-2 text-sm font-bold text-slate-700">{text.images}</p>
                <div className="grid grid-cols-3 gap-2 md:grid-cols-5">
                  {viewingAd.images.map((image) => (
                    <img key={image.imageUrl} src={image.imageUrl} alt={viewingAd.title} className="h-20 rounded-xl object-cover" />
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                href={localizedPath(`/listing/${viewingAd.id}`)}
                target="_blank"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 font-bold text-white transition hover:bg-slate-800"
              >
                <ExternalLink size={16} />
                {text.viewOnSite}
              </Link>
              {!viewingAd.deletedAt ? (
                <button
                  onClick={async () => {
                    await toggleActive(viewingAd);
                    setViewingAd(null);
                  }}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 font-bold ${viewingAd.isActive ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-600'}`}
                >
                  {viewingAd.isActive ? <PowerOff size={16} /> : <Power size={16} />}
                  {viewingAd.isActive ? text.deactivate : text.activate}
                </button>
              ) : null}
              <button
                onClick={() => {
                  const ad = viewingAd;
                  setViewingAd(null);
                  startEdit(ad);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 font-bold text-blue-600"
              >
                <Edit3 size={16} />{text.edit}
              </button>
              {viewingAd.deletedAt ? (
                <button
                  onClick={async () => {
                    await restoreAd(viewingAd);
                    setViewingAd(null);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-green-50 px-4 py-2 font-bold text-green-600"
                >
                  <RotateCcw size={16} />{text.restore}
                </button>
              ) : (
                <button
                  onClick={async () => {
                    const deleted = await deleteAd(viewingAd);
                    if (deleted) setViewingAd(null);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2 font-bold text-red-600"
                >
                  <Trash2 size={16} />{text.delete}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <div className="mt-1 break-words font-bold text-slate-900">{value}</div>
    </div>
  );
}

function Badge({ children, variant }: { children: ReactNode; variant?: 'sold' | 'deleted' }) {
  const className =
    variant === 'sold'
      ? 'inline-block max-w-full truncate rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800'
      : variant === 'deleted'
        ? 'inline-block max-w-full truncate rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700'
      : 'inline-block max-w-full truncate rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700';
  return <span className={className}>{children}</span>;
}

function formatPrice(price: string | number | null | undefined, currency: string) {
  if (price === null || price === undefined || price === '') return '-';
  return `${Number(price).toLocaleString()} ${currency === 'OMR' ? 'ر.ع' : currency}`;
}
