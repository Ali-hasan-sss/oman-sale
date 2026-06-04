'use client';

import { Edit3, Plus, Store, Trash2, X } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';

import { adminApi } from '@/lib/admin-auth';
import { useI18n } from '@/lib/i18n';

type StoreTypeRecord = {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  icon?: string | null;
  sortOrder: number;
  isActive: boolean;
};

type StoreTypeForm = {
  nameAr: string;
  nameEn: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
};

const emptyForm = (): StoreTypeForm => ({
  nameAr: '',
  nameEn: '',
  icon: '',
  sortOrder: 0,
  isActive: true
});

const thClass = 'px-3 py-2 align-middle text-start text-xs font-bold text-slate-500';
const tdClass = 'px-3 py-3 align-middle text-start text-sm text-slate-900';

export function AdminStoreTypesManagement() {
  const { locale, dir } = useI18n();
  const isAr = locale === 'ar';
  const formRef = useRef<HTMLFormElement | null>(null);
  const [items, setItems] = useState<StoreTypeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<StoreTypeForm>(emptyForm());

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminApi().get<{ data: StoreTypeRecord[] }>('/admin/store-types');
      setItems(response.data.data);
    } catch {
      setError(isAr ? 'تعذر تحميل أنواع المتاجر.' : 'Could not load store types.');
    } finally {
      setLoading(false);
    }
  }, [isAr]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const openCreate = () => {
    setEditingId(null);
    setForm({
      ...emptyForm(),
      sortOrder: items.length > 0 ? Math.max(...items.map((item) => item.sortOrder)) + 1 : 0
    });
    setShowForm(true);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const openEdit = (item: StoreTypeRecord) => {
    setEditingId(item.id);
    setForm({
      nameAr: item.nameAr,
      nameEn: item.nameEn,
      icon: item.icon ?? '',
      sortOrder: item.sortOrder,
      isActive: item.isActive
    });
    setShowForm(true);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const payload = {
        nameAr: form.nameAr.trim(),
        nameEn: form.nameEn.trim(),
        icon: form.icon.trim() || undefined,
        sortOrder: form.sortOrder,
        isActive: form.isActive
      };
      if (editingId) {
        await adminApi().patch(`/admin/store-types/${editingId}`, payload);
        setMessage(isAr ? 'تم تحديث نوع المتجر.' : 'Store type updated.');
      } else {
        await adminApi().post('/admin/store-types', payload);
        setMessage(isAr ? 'تم إضافة نوع المتجر.' : 'Store type added.');
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm());
      await loadItems();
    } catch {
      setError(isAr ? 'تعذر حفظ نوع المتجر.' : 'Could not save store type.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(isAr ? 'حذف نوع المتجر؟' : 'Delete this store type?')) return;
    setError('');
    try {
      await adminApi().delete(`/admin/store-types/${id}`);
      setMessage(isAr ? 'تم حذف نوع المتجر.' : 'Store type deleted.');
      await loadItems();
    } catch {
      setError(isAr ? 'تعذر حذف نوع المتجر.' : 'Could not delete store type.');
    }
  };

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <Store size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">{isAr ? 'أنواع المتاجر' : 'Store types'}</h2>
            <p className="text-sm text-slate-500">
              {isAr ? 'إدارة تصنيفات أنواع المتاجر (معارض، مكاتب، متاجر...)' : 'Manage store type categories (showrooms, offices, shops...)'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-700"
        >
          <Plus size={16} />
          {isAr ? 'إضافة نوع' : 'Add type'}
        </button>
      </div>

      {message ? <p className="mb-4 text-sm font-bold text-green-700">{message}</p> : null}
      {error ? <p className="mb-4 text-sm font-bold text-red-600">{error}</p> : null}

      {showForm ? (
        <form ref={formRef} onSubmit={handleSubmit} className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-black">{editingId ? (isAr ? 'تعديل نوع المتجر' : 'Edit store type') : isAr ? 'نوع متجر جديد' : 'New store type'}</h3>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg p-2 hover:bg-white">
              <X size={18} />
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-bold">{isAr ? 'الاسم بالعربية *' : 'Arabic name *'}</label>
              <input value={form.nameAr} onChange={(e) => setForm((c) => ({ ...c, nameAr: e.target.value }))} className={inputClass} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold">{isAr ? 'الاسم بالإنجليزية *' : 'English name *'}</label>
              <input value={form.nameEn} onChange={(e) => setForm((c) => ({ ...c, nameEn: e.target.value }))} className={inputClass} required dir="ltr" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold">{isAr ? 'الأيقونة' : 'Icon key'}</label>
              <input value={form.icon} onChange={(e) => setForm((c) => ({ ...c, icon: e.target.value }))} className={inputClass} placeholder="car, store, shirt..." dir="ltr" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold">{isAr ? 'الترتيب' : 'Sort order'}</label>
              <input type="number" value={form.sortOrder} onChange={(e) => setForm((c) => ({ ...c, sortOrder: Number(e.target.value) }))} className={inputClass} min={0} />
            </div>
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm font-bold">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((c) => ({ ...c, isActive: e.target.checked }))} />
            {isAr ? 'نشط' : 'Active'}
          </label>
          <button type="submit" disabled={saving} className="mt-4 rounded-xl bg-brand-600 px-5 py-2.5 font-bold text-white hover:bg-brand-700 disabled:opacity-60">
            {saving ? (isAr ? 'جاري الحفظ...' : 'Saving...') : isAr ? 'حفظ' : 'Save'}
          </button>
        </form>
      ) : null}

      {loading ? (
        <p className="text-center font-bold text-slate-500">{isAr ? 'جاري التحميل...' : 'Loading...'}</p>
      ) : (
        <div className="overflow-x-auto" dir={dir}>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-start">
                <th className={thClass}>{isAr ? 'الاسم (ع)' : 'Name (AR)'}</th>
                <th className={thClass}>{isAr ? 'الاسم (EN)' : 'Name (EN)'}</th>
                <th className={thClass}>{isAr ? 'الترتيب' : 'Order'}</th>
                <th className={thClass}>{isAr ? 'الحالة' : 'Status'}</th>
                <th className={thClass}>{isAr ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-slate-100">
                  <td className={`${tdClass} font-bold`}>{item.nameAr}</td>
                  <td className={tdClass}>
                    <span dir="ltr" className="inline-block text-start">
                      {item.nameEn}
                    </span>
                  </td>
                  <td className={tdClass}>{item.sortOrder}</td>
                  <td className={tdClass}>{item.isActive ? (isAr ? 'نشط' : 'Active') : isAr ? 'غير نشط' : 'Inactive'}</td>
                  <td className={tdClass}>
                    <div className="flex justify-start gap-2">
                      <button type="button" onClick={() => openEdit(item)} className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50">
                        <Edit3 size={15} />
                      </button>
                      <button type="button" onClick={() => handleDelete(item.id)} className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
