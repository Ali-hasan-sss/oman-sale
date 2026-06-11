'use client';

import { Building2, Eye, EllipsisVertical, Power, PowerOff, RefreshCw, Search, Sparkles, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { FormEvent, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { AdminEntityAvatar } from '@/components/admin/admin-entity-avatar';
import { AdminStoresTableSkeleton } from '@/components/admin/admin-stores-table-skeleton';
import { SubscriptionRingGauge } from '@/components/stores/subscription-ring-gauge';
import { adminApi } from '@/lib/admin-auth';
import { resolveMediaUrl } from '@/lib/media-url';
import { useI18n } from '@/lib/i18n';
import { getStoreLocationLabel, getWilayahsForGovernorate, omanGovernorates } from '@/lib/oman-locations';
import {
  getBillingPeriodLabel,
  STORE_BILLING_PERIODS,
  type StoreBillingPeriod
} from '@/lib/store-billing-period';
import {
  canRenewActiveSubscriptionWithinWindow,
  getEffectiveSubscriptionMaxListings,
  getListingsUsageColor,
  getSubscriptionTimeUsage,
  getTimeUsageColor
} from '@/lib/subscription-usage';

type RootCategory = {
  id: string;
  name: string;
  nameAr: string;
  nameEn: string;
  parentId?: string | null;
};

type StorePlanPricing = {
  billingPeriod: StoreBillingPeriod;
  finalPrice?: number;
  price: string | number;
  maxListings: number;
};

type StorePlan = {
  id: string;
  nameAr: string;
  nameEn: string;
  pricing: StorePlanPricing[];
};

type AdminStore = {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  bioAr?: string;
  bioEn?: string;
  logoUrl?: string | null;
  coverUrl?: string | null;
  phone?: string | null;
  city?: string | null;
  wilayah?: string | null;
  businessType?: 'COMMERCIAL' | 'HOME';
  nationalId?: string;
  commercialRegistrationNumber?: string;
  isActive: boolean;
  accessStatus: 'ACTIVE' | 'TRIAL' | 'TRIAL_EXPIRED' | 'SUBSCRIPTION_EXPIRED' | 'DISABLED';
  listingsCount: number;
  createdAt: string;
  user?: { id: string; fullName: string; email: string; phone?: string | null; avatar?: string | null } | null;
  rootCategory?: { id: string; nameAr: string; nameEn: string } | null;
  subscriptions: Array<{
    id: string;
    isActive: boolean;
    isTrial: boolean;
    status: string;
    billingPeriod: StoreBillingPeriod;
    maxListings: number;
    baselineListings?: number;
    startsAt?: string | null;
    endsAt?: string | null;
    finalPrice?: string | number;
    plan?: { id: string; nameAr: string; nameEn: string; trialMaxListings?: number } | null;
  }>;
};

type StoresResponse = {
  items: AdminStore[];
  total: number;
  page: number;
  limit: number;
};

const inputClass = 'w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-100';
const filterSelectClass =
  'h-11 min-w-[9.5rem] rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-brand-100';
const fallbackImage = '/logo.png';
const thClass = 'px-2 py-2 align-middle text-start text-xs font-bold text-slate-500 lg:px-2.5';
const tdClass = 'px-2 py-2 align-middle text-start text-xs text-slate-900 lg:px-2.5';

export function AdminStoresManagement() {
  const { locale, dir, localizedPath, m } = useI18n();
  const text = m.adminStores;

  const [stores, setStores] = useState<AdminStore[]>([]);
  const [categories, setCategories] = useState<RootCategory[]>([]);
  const [query, setQuery] = useState('');
  const [rootCategoryId, setRootCategoryId] = useState('');
  const [city, setCity] = useState('');
  const [wilayah, setWilayah] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [assignTarget, setAssignTarget] = useState<AdminStore | null>(null);
  const [plans, setPlans] = useState<StorePlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [billingPeriod, setBillingPeriod] = useState<StoreBillingPeriod>('ONE_MONTH');
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [detailStore, setDetailStore] = useState<AdminStore | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [storeDetail, setStoreDetail] = useState<AdminStore | null>(null);
  const [isLoadingStoreDetail, setIsLoadingStoreDetail] = useState(false);
  const [openActionsMenuId, setOpenActionsMenuId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminStore | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const rootCategories = useMemo(
    () => categories.filter((category) => !category.parentId),
    [categories]
  );

  const loadStores = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await adminApi().get<{ data: StoresResponse }>('/admin/stores', {
        params: {
          q: query.trim() || undefined,
          rootCategoryId: rootCategoryId || undefined,
          city: city || undefined,
          wilayah: city && wilayah ? wilayah : undefined,
          isActive: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined,
          page: 1,
          limit: 30
        }
      });
      setStores(response.data.data.items);
      setTotal(response.data.data.total);
    } catch {
      setError(text.loadError);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    adminApi()
      .get<{ data: { items: RootCategory[] } }>('/admin/categories', { params: { all: true } })
      .then((response) => setCategories(response.data.data.items))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    loadStores();
  }, [rootCategoryId, city, wilayah, statusFilter, locale]);

  const wilayahOptions = useMemo(() => (city ? getWilayahsForGovernorate(city) : []), [city]);

  const activeSubscription = (store: AdminStore) => {
    const now = Date.now();
    return (
      store.subscriptions.find(
        (subscription) =>
          subscription.isActive &&
          subscription.status === 'ACTIVE' &&
          subscription.endsAt &&
          new Date(subscription.endsAt).getTime() > now
      ) ?? store.subscriptions[0] ??
      null
    );
  };

  const canRenewSubscription = (store: AdminStore) => {
    const subscription = activeSubscription(store);
    if (!subscription || subscription.isTrial || !subscription.endsAt) return false;
    return canRenewActiveSubscriptionWithinWindow(subscription.endsAt);
  };

  const renewSubscription = async (store: AdminStore) => {
    if (!canRenewSubscription(store)) return;
    if (!window.confirm(text.renewConfirm)) return;

    setOpenActionsMenuId(null);
    setActionError('');
    try {
      await adminApi().post(`/admin/stores/${store.id}/renew-subscription`);
      await loadStores();
    } catch {
      setActionError(text.renewError);
    }
  };

  const accessLabel = (status: AdminStore['accessStatus']) => {
    if (status === 'ACTIVE') return text.statusActive;
    if (status === 'TRIAL') return text.statusTrial;
    if (status === 'DISABLED') return text.statusDisabled;
    return text.statusExpired;
  };

  const toggleStore = async (store: AdminStore) => {
    setActionError('');
    try {
      if (store.isActive) {
        await adminApi().post(`/admin/stores/${store.id}/deactivate`);
      } else {
        await adminApi().post(`/admin/stores/${store.id}/activate`);
      }
      await loadStores();
    } catch {
      setActionError(text.actionError);
    }
  };

  const openAssignPlan = async (store: AdminStore) => {
    if (!store.rootCategory?.id) return;
    setAssignTarget(store);
    setActionError('');
    setSelectedPlanId('');
    setBillingPeriod('ONE_MONTH');
    setIsLoadingPlans(true);
    try {
      const response = await adminApi().get<{ data: StorePlan[] }>('/stores/plans', {
        params: { rootCategoryId: store.rootCategory.id }
      });
      const nextPlans = response.data.data;
      setPlans(nextPlans);
      setSelectedPlanId(nextPlans[0]?.id ?? '');
    } catch {
      setPlans([]);
      setActionError(text.assignError);
    } finally {
      setIsLoadingPlans(false);
    }
  };

  const closeAssignPlan = () => {
    setAssignTarget(null);
    setPlans([]);
    setSelectedPlanId('');
    setActionError('');
  };

  const submitAssignPlan = async (event: FormEvent) => {
    event.preventDefault();
    if (!assignTarget || !selectedPlanId) return;

    setIsSaving(true);
    setActionError('');
    try {
      await adminApi().post(`/admin/stores/${assignTarget.id}/assign-plan`, {
        planId: selectedPlanId,
        billingPeriod
      });
      closeAssignPlan();
      await loadStores();
    } catch {
      setActionError(text.assignError);
    } finally {
      setIsSaving(false);
    }
  };

  const openSubscriptionDetail = async (store: AdminStore) => {
    setOpenActionsMenuId(null);
    setDetailStore(store);
    setIsLoadingDetail(true);
    setActionError('');
    try {
      const response = await adminApi().get<{ data: AdminStore }>(`/admin/stores/${store.id}`);
      setDetailStore(response.data.data);
    } catch {
      setActionError(text.loadError);
      setDetailStore(null);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const openStoreDetail = async (store: AdminStore) => {
    setOpenActionsMenuId(null);
    setStoreDetail(store);
    setIsLoadingStoreDetail(true);
    setActionError('');
    try {
      const response = await adminApi().get<{ data: AdminStore }>(`/admin/stores/${store.id}`);
      setStoreDetail(response.data.data);
    } catch {
      setActionError(text.loadError);
      setStoreDetail(null);
    } finally {
      setIsLoadingStoreDetail(false);
    }
  };

  const closeStoreDetail = () => {
    setStoreDetail(null);
    setActionError('');
  };

  const closeSubscriptionDetail = () => {
    setDetailStore(null);
    setActionError('');
  };

  const confirmDeleteStore = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setActionError('');
    try {
      await adminApi().delete(`/admin/stores/${deleteTarget.id}`);
      setDeleteTarget(null);
      if (detailStore?.id === deleteTarget.id) setDetailStore(null);
      if (storeDetail?.id === deleteTarget.id) setStoreDetail(null);
      await loadStores();
    } catch {
      setActionError(text.deleteError);
    } finally {
      setIsDeleting(false);
    }
  };

  const subscriptionStatusLabel = (subscription: AdminStore['subscriptions'][number]) => {
    if (subscription.isTrial) return text.trial;
    return text.paid;
  };

  const detailActiveSubscription = useMemo(
    () => (detailStore ? activeSubscription(detailStore) : null),
    [detailStore]
  );

  const detailListingsUsed = detailStore?.listingsCount ?? 0;

  const detailEffectiveMaxListings = useMemo(() => {
    if (!detailActiveSubscription) return 0;
    return getEffectiveSubscriptionMaxListings({
      isTrial: detailActiveSubscription.isTrial,
      maxListings: detailActiveSubscription.maxListings,
      baselineListings: detailActiveSubscription.baselineListings,
      trialMaxListings: detailActiveSubscription.plan?.trialMaxListings
    });
  }, [detailActiveSubscription]);

  const detailSubscriptionTimeUsage = useMemo(() => {
    if (!detailActiveSubscription) return null;
    return getSubscriptionTimeUsage({
      startsAt: detailActiveSubscription.startsAt,
      endsAt: detailActiveSubscription.endsAt,
      billingPeriod: detailActiveSubscription.billingPeriod
    });
  }, [detailActiveSubscription]);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-brand-800 p-8 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
            <Building2 size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-black">{text.title}</h2>
            <p className="mt-1 text-white/80">{text.subtitle}</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="mb-6 space-y-3">
          <p className="text-sm text-slate-500">
            {m.admin.totalResults}: {total.toLocaleString(locale === 'ar' ? 'ar-OM' : 'en-US')}
          </p>

          <div className="flex flex-wrap items-center gap-3 lg:flex-nowrap">
            <div className="flex min-w-[min(100%,18rem)] flex-1 items-stretch gap-2 sm:min-w-[14rem] sm:max-w-md">
              <div className="relative min-w-0 flex-1">
                <Search
                  className={`absolute top-1/2 -translate-y-1/2 text-slate-400 ${dir === 'rtl' ? 'right-3' : 'left-3'}`}
                  size={18}
                />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') loadStores();
                  }}
                  placeholder={text.search}
                  className={`${inputClass} h-11 py-2 ${dir === 'rtl' ? 'pr-10' : 'pl-10'}`}
                />
              </div>
              <button
                type="button"
                onClick={loadStores}
                className="shrink-0 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                {m.admin.search}
              </button>
            </div>

            <select
              value={rootCategoryId}
              onChange={(event) => setRootCategoryId(event.target.value)}
              className={filterSelectClass}
            >
              <option value="">{text.allCategories}</option>
              {rootCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {locale === 'en' ? category.nameEn || category.name : category.nameAr || category.name}
                </option>
              ))}
            </select>

            <select
              value={city}
              onChange={(event) => {
                setCity(event.target.value);
                setWilayah('');
              }}
              className={filterSelectClass}
            >
              <option value="">{text.allCities}</option>
              {omanGovernorates.map((governorate) => (
                <option key={governorate.value} value={governorate.value}>
                  {locale === 'en' ? governorate.en : governorate.ar}
                </option>
              ))}
            </select>

            {city ? (
              <select value={wilayah} onChange={(event) => setWilayah(event.target.value)} className={filterSelectClass}>
                <option value="">{text.allWilayahs}</option>
                {wilayahOptions.map((wilayahOption) => (
                  <option key={wilayahOption.value} value={wilayahOption.value}>
                    {locale === 'en' ? wilayahOption.en : wilayahOption.ar}
                  </option>
                ))}
              </select>
            ) : null}

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className={filterSelectClass}
            >
              <option value="">{text.allStatuses}</option>
              <option value="active">{text.activeOnly}</option>
              <option value="inactive">{text.inactiveOnly}</option>
            </select>
          </div>
        </div>

        {error ? <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p> : null}
        {actionError && !assignTarget ? (
          <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{actionError}</p>
        ) : null}

        <div className="overflow-x-auto" dir={dir}>
          <table className="w-full table-fixed text-sm">
            <colgroup>
              <col className="w-[19%]" />
              <col className="w-[19%]" />
              <col className="w-[11%]" />
              <col className="w-[13%]" />
              <col className="w-[9%]" />
              <col className="w-[6%]" />
              <col className="w-[8%]" />
              <col className="w-[5%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-slate-200 text-start">
                <th className={thClass}>
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-9 w-9 shrink-0" aria-hidden />
                    <span>{text.store}</span>
                  </div>
                </th>
                <th className={thClass}>
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-8 w-8 shrink-0" aria-hidden />
                    <span>{text.owner}</span>
                  </div>
                </th>
                <th className={thClass}>{text.category}</th>
                <th className={thClass}>{text.plan}</th>
                <th className={thClass}>{text.accessStatus}</th>
                <th className={thClass}>{text.listings}</th>
                <th className={thClass}>{m.admin.status}</th>
                <th className={thClass}>{m.admin.actions}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <AdminStoresTableSkeleton rows={10} />
              ) : stores.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                    {text.empty}
                  </td>
                </tr>
              ) : (
                stores.map((store) => {
                  const subscription = activeSubscription(store);
                  const planName = subscription?.plan
                    ? locale === 'en'
                      ? subscription.plan.nameEn
                      : subscription.plan.nameAr
                    : text.noPlan;
                  const storeName = locale === 'en' ? store.nameEn : store.nameAr;

                  return (
                    <tr key={store.id} className="border-b border-slate-100">
                      <td className={tdClass}>
                        <div className="flex items-center gap-2">
                          <AdminEntityAvatar src={store.logoUrl} name={storeName} className="h-9 w-9 rounded-lg" />
                          <div className="min-w-0 text-start">
                            <p className="truncate text-xs font-bold">{storeName}</p>
                            <p className="truncate text-[11px] text-slate-500" dir="ltr">
                              {store.slug}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className={tdClass}>
                        <div className="flex items-center gap-2">
                          <AdminEntityAvatar
                            src={store.user?.avatar}
                            name={store.user?.fullName}
                            className="h-8 w-8 rounded-full"
                          />
                          <div className="min-w-0 text-start">
                            {store.user?.id ? (
                              <Link
                                href={localizedPath(`/admin/users/${store.user.id}`)}
                                className="block truncate text-start text-xs font-bold text-brand-700 transition hover:text-brand-800 hover:underline"
                              >
                                {store.user.fullName}
                              </Link>
                            ) : (
                              <p className="text-start text-xs font-bold">-</p>
                            )}
                            <p className="truncate text-start text-[11px] text-slate-500" dir="ltr">
                              {store.user?.email ?? '-'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className={`${tdClass} truncate text-slate-700`}>
                        <span className="block truncate">
                          {(locale === 'en' ? store.rootCategory?.nameEn : store.rootCategory?.nameAr) ?? '-'}
                        </span>
                      </td>
                      <td className={tdClass}>
                        <p className="truncate text-start text-xs font-bold">{planName}</p>
                        {subscription ? (
                          <p className="truncate text-start text-[11px] text-slate-500">
                            {getBillingPeriodLabel(subscription.billingPeriod, locale)} · {subscription.maxListings}
                          </p>
                        ) : null}
                      </td>
                      <td className={tdClass}>
                        <span className="inline-flex max-w-full truncate rounded-full bg-slate-100 px-2 py-0.5 text-start text-[11px] font-bold text-slate-700">
                          {accessLabel(store.accessStatus)}
                        </span>
                      </td>
                      <td className={`${tdClass} text-xs font-bold`}>{store.listingsCount}</td>
                      <td className={tdClass}>
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-start text-[11px] font-bold ${
                            store.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {store.isActive ? m.admin.active : m.admin.inactive}
                        </span>
                      </td>
                      <td className={tdClass}>
                        <StoreActionsMenu
                            store={store}
                            dir={dir}
                            text={text}
                            canRenew={canRenewSubscription(store)}
                            isOpen={openActionsMenuId === store.id}
                            onToggle={() => setOpenActionsMenuId((current) => (current === store.id ? null : store.id))}
                            onClose={() => setOpenActionsMenuId(null)}
                            onViewDetails={() => openStoreDetail(store)}
                            onViewSubscription={() => openSubscriptionDetail(store)}
                            onToggleActive={() => {
                              setOpenActionsMenuId(null);
                              toggleStore(store);
                            }}
                            onAssignPlan={() => {
                              setOpenActionsMenuId(null);
                              openAssignPlan(store);
                            }}
                            onRenew={() => renewSubscription(store)}
                          onDelete={() => {
                            setOpenActionsMenuId(null);
                            setDeleteTarget(store);
                          }}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {assignTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <form onSubmit={submitAssignPlan} className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">{text.assignPlanTitle}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {locale === 'en' ? assignTarget.nameEn : assignTarget.nameAr}
                </p>
                <p className="mt-2 text-sm text-slate-600">{text.assignPlanHint}</p>
              </div>
              <button type="button" onClick={closeAssignPlan} className="rounded-xl border border-slate-200 p-2 text-slate-600">
                <X size={18} />
              </button>
            </div>

            {actionError ? <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{actionError}</p> : null}

            {isLoadingPlans ? (
              <p className="py-8 text-center text-slate-500">{text.loading}</p>
            ) : plans.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-slate-500">{text.empty}</p>
            ) : (
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 block font-bold text-slate-700">{text.selectPlan}</span>
                  <select value={selectedPlanId} onChange={(event) => setSelectedPlanId(event.target.value)} className={inputClass} required>
                    {plans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {locale === 'en' ? plan.nameEn : plan.nameAr}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block font-bold text-slate-700">{text.billingPeriod}</span>
                  <select
                    value={billingPeriod}
                    onChange={(event) => setBillingPeriod(event.target.value as StoreBillingPeriod)}
                    className={inputClass}
                  >
                    {STORE_BILLING_PERIODS.map((period) => (
                      <option key={period} value={period}>
                        {getBillingPeriodLabel(period, locale)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                type="submit"
                disabled={isSaving || isLoadingPlans || !selectedPlanId}
                className="flex-1 rounded-xl bg-brand-600 px-4 py-3 font-bold text-white disabled:opacity-60"
              >
                {isSaving ? text.loading : text.confirmAssign}
              </button>
              <button type="button" onClick={closeAssignPlan} className="rounded-xl border border-slate-200 px-4 py-3 font-bold text-slate-700">
                {text.cancel}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {storeDetail ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">{text.storeDetails}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {locale === 'en' ? storeDetail.nameEn : storeDetail.nameAr}
                </p>
              </div>
              <button type="button" onClick={closeStoreDetail} className="rounded-xl border border-slate-200 p-2 text-slate-600">
                <X size={18} />
              </button>
            </div>

            {isLoadingStoreDetail ? (
              <p className="py-10 text-center text-slate-500">{text.loading}</p>
            ) : (
              <div className="space-y-6">
                <div className="overflow-hidden rounded-2xl bg-slate-100">
                  <img
                    src={storeDetail.coverUrl ? resolveMediaUrl(storeDetail.coverUrl) : fallbackImage}
                    alt=""
                    className={`h-40 w-full ${storeDetail.coverUrl ? 'object-cover' : 'object-contain p-8'}`}
                  />
                </div>

                <div className="flex flex-wrap items-start gap-4">
                  <AdminEntityAvatar
                    src={storeDetail.logoUrl}
                    name={locale === 'en' ? storeDetail.nameEn : storeDetail.nameAr}
                    className="h-20 w-20 rounded-2xl border-4 border-white shadow-md"
                  />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{accessLabel(storeDetail.accessStatus)}</span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          storeDetail.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {storeDetail.isActive ? m.admin.active : m.admin.inactive}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">{storeDetail.slug}</p>
                    <p className="text-sm font-bold text-slate-700">
                      {(locale === 'en' ? storeDetail.rootCategory?.nameEn : storeDetail.rootCategory?.nameAr) ?? '-'}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <DetailField
                    label={text.businessType}
                    value={
                      storeDetail.businessType === 'HOME'
                        ? text.homeBusiness
                        : storeDetail.businessType === 'COMMERCIAL'
                          ? text.commercialBusiness
                          : '-'
                    }
                  />
                  <DetailField label={text.nationalId} value={storeDetail.nationalId} />
                  {storeDetail.businessType === 'COMMERCIAL' ? (
                    <DetailField label={text.commercialRegistration} value={storeDetail.commercialRegistrationNumber} />
                  ) : null}
                  <DetailField label={text.storePhone} value={storeDetail.phone} />
                  <DetailField label={text.city} value={getStoreLocationLabel(storeDetail.city, storeDetail.wilayah, locale)} />
                  <DetailField
                    label={text.createdAt}
                    value={new Date(storeDetail.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-OM' : 'en-GB')}
                  />
                  <DetailField label={text.listings} value={String(storeDetail.listingsCount)} />
                </div>

                {storeDetail.bioAr ? (
                  <DetailBlock label={text.bioAr} value={storeDetail.bioAr} />
                ) : null}
                {storeDetail.bioEn ? (
                  <DetailBlock label={text.bioEn} value={storeDetail.bioEn} dir="ltr" />
                ) : null}

                {storeDetail.user ? (
                  <div className="rounded-2xl border border-slate-100 p-4">
                    <p className="mb-3 text-sm font-bold text-slate-500">{text.owner}</p>
                    <div className="flex flex-wrap items-center gap-4">
                      <AdminEntityAvatar
                        src={storeDetail.user.avatar}
                        name={storeDetail.user.fullName}
                        className="h-14 w-14 rounded-full"
                      />
                      <div className="min-w-0 flex-1">
                        <Link
                          href={localizedPath(`/admin/users/${storeDetail.user.id}`)}
                          className="font-bold text-brand-700 hover:underline"
                        >
                          {storeDetail.user.fullName}
                        </Link>
                        <p className="text-sm text-slate-600">{storeDetail.user.email}</p>
                        {storeDetail.user.phone ? (
                          <p className="text-sm text-slate-600" dir="ltr">
                            {storeDetail.user.phone}
                          </p>
                        ) : null}
                      </div>
                      <Link
                        href={localizedPath(`/admin/users/${storeDetail.user.id}`)}
                        className="rounded-xl bg-brand-50 px-4 py-2 text-sm font-bold text-brand-700 hover:bg-brand-100"
                      >
                        {text.viewOwnerProfile}
                      </Link>
                    </div>
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={() => {
                    const target = storeDetail;
                    closeStoreDetail();
                    if (target) void openSubscriptionDetail(target);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  <Eye size={16} />
                  {text.viewSubscription}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {detailStore ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">{text.subscriptionDetails}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {locale === 'en' ? detailStore.nameEn : detailStore.nameAr}
                </p>
                <p className="mt-1 text-xs text-slate-400">{detailStore.slug}</p>
              </div>
              <button type="button" onClick={closeSubscriptionDetail} className="rounded-xl border border-slate-200 p-2 text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="mb-4 flex flex-wrap gap-2 text-sm">
              <span className="rounded-full bg-slate-100 px-3 py-1 font-bold">{accessLabel(detailStore.accessStatus)}</span>
              <span
                className={`rounded-full px-3 py-1 font-bold ${
                  detailStore.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}
              >
                {detailStore.isActive ? m.admin.active : m.admin.inactive}
              </span>
            </div>

            {isLoadingDetail ? (
              <p className="py-8 text-center text-slate-500">{text.loading}</p>
            ) : detailStore.subscriptions.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-slate-500">{text.noPlan}</p>
            ) : (
              <div className="space-y-4">
                {detailActiveSubscription ? (
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-sm">
                      <p className="font-bold text-slate-900">
                        {detailActiveSubscription.plan
                          ? locale === 'en'
                            ? detailActiveSubscription.plan.nameEn
                            : detailActiveSubscription.plan.nameAr
                          : text.noPlan}
                      </p>
                      <p className="mt-1 text-slate-600">
                        {getBillingPeriodLabel(detailActiveSubscription.billingPeriod, locale)}
                        {detailActiveSubscription.isTrial ? ` • ${text.trial}` : ` • ${text.paid}`}
                      </p>
                      {detailActiveSubscription.endsAt ? (
                        <p className="mt-1 text-slate-600">
                          {text.endsAt}:{' '}
                          {new Date(detailActiveSubscription.endsAt).toLocaleDateString(locale === 'ar' ? 'ar-OM' : 'en-GB')}
                        </p>
                      ) : null}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <SubscriptionRingGauge
                        title={text.listingsUsage}
                        used={detailListingsUsed}
                        total={detailEffectiveMaxListings}
                        usedLabel={text.listingsConsumed}
                        remainingLabel={text.listingsRemaining}
                        centerValue={`${Math.max(detailEffectiveMaxListings - detailListingsUsed, 0)}`}
                        centerSub={text.listingsRemaining}
                        accentColor={getListingsUsageColor(detailListingsUsed, detailEffectiveMaxListings)}
                      />
                      {detailSubscriptionTimeUsage ? (
                        <SubscriptionRingGauge
                          title={text.subscriptionTime}
                          used={detailSubscriptionTimeUsage.elapsedDays}
                          total={detailSubscriptionTimeUsage.totalDays}
                          usedLabel={text.daysConsumed}
                          remainingLabel={text.daysRemaining}
                          centerValue={`${detailSubscriptionTimeUsage.remainingDays}`}
                          centerSub={text.dayUnit}
                          accentColor={getTimeUsageColor(detailSubscriptionTimeUsage.elapsedRatio)}
                        />
                      ) : null}
                    </div>
                  </div>
                ) : null}

                <h4 className="font-bold text-slate-700">{text.subscriptionHistory}</h4>
                {detailStore.subscriptions.map((subscription) => (
                  <div key={subscription.id} className="rounded-2xl border border-slate-100 p-4 text-sm">
                    <p className="font-bold text-slate-900">
                      {subscription.plan
                        ? locale === 'en'
                          ? subscription.plan.nameEn
                          : subscription.plan.nameAr
                        : text.noPlan}
                    </p>
                    <p className="mt-1 text-slate-600">
                      {text.subscriptionStatus}: {subscription.status} • {subscriptionStatusLabel(subscription)}
                    </p>
                    {subscription.startsAt ? (
                      <p className="text-slate-600">
                        {text.startsAt}: {new Date(subscription.startsAt).toLocaleDateString(locale === 'ar' ? 'ar-OM' : 'en-GB')}
                      </p>
                    ) : null}
                    {subscription.endsAt ? (
                      <p className="text-slate-600">
                        {text.endsAt}: {new Date(subscription.endsAt).toLocaleDateString(locale === 'ar' ? 'ar-OM' : 'en-GB')}
                      </p>
                    ) : null}
                    <p className="text-slate-600">
                      {getBillingPeriodLabel(subscription.billingPeriod, locale)} • {text.maxListings}:{' '}
                      {subscription.maxListings}
                    </p>
                    {subscription.finalPrice != null ? (
                      <p className="text-slate-600">
                        {text.price}: {Number(subscription.finalPrice).toFixed(3)} OMR
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-black text-slate-900">{text.deleteStore}</h3>
            <p className="mt-2 text-sm text-slate-600">{text.deleteConfirm}</p>
            <p className="mt-2 font-bold text-slate-800">
              {locale === 'en' ? deleteTarget.nameEn : deleteTarget.nameAr}
            </p>
            {actionError ? (
              <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{actionError}</p>
            ) : null}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDeleteStore}
                className="flex-1 rounded-xl bg-red-600 px-4 py-3 font-bold text-white disabled:opacity-60"
              >
                {isDeleting ? text.loading : text.deleteStore}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  setDeleteTarget(null);
                  setActionError('');
                }}
                className="rounded-xl border border-slate-200 px-4 py-3 font-bold text-slate-700"
              >
                {text.cancel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

type StoreActionsMenuProps = {
  store: AdminStore;
  dir: 'rtl' | 'ltr';
  text: {
    storeDetails: string;
    viewStoreDetails: string;
    viewSubscription: string;
    assignPlan: string;
    renewSubscription: string;
    deactivate: string;
    activate: string;
    deleteStore: string;
  };
  canRenew: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onViewDetails: () => void;
  onViewSubscription: () => void;
  onToggleActive: () => void;
  onAssignPlan: () => void;
  onRenew: () => void;
  onDelete: () => void;
};

function StoreActionsMenu({
  store,
  dir,
  text,
  canRenew,
  isOpen,
  onToggle,
  onClose,
  onViewDetails,
  onViewSubscription,
  onToggleActive,
  onAssignPlan,
  onRenew,
  onDelete
}: StoreActionsMenuProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateMenuPosition = () => {
    const trigger = triggerRef.current;
    const menu = menuRef.current;
    if (!trigger || !menu) return;

    const triggerRect = trigger.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    const gap = 8;
    const edgePadding = 8;

    let left =
      dir === 'rtl'
        ? triggerRect.left
        : triggerRect.right - menuRect.width;

    left = Math.max(edgePadding, Math.min(left, window.innerWidth - menuRect.width - edgePadding));

    let top = triggerRect.top - gap - menuRect.height;
    if (top < edgePadding) {
      top = triggerRect.bottom + gap;
    }

    setMenuPosition({ top, left });
  };

  useLayoutEffect(() => {
    if (!isOpen) {
      setMenuPosition(null);
      return;
    }
    updateMenuPosition();
  }, [isOpen, dir]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      onClose();
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
  }, [isOpen, onClose, dir]);

  const itemClass =
    'flex w-full items-center gap-2 px-4 py-2.5 text-start text-sm font-bold text-slate-700 transition hover:bg-slate-50';

  const menu =
    isOpen && mounted ? (
      <div
        ref={menuRef}
        style={{
          position: 'fixed',
          top: menuPosition?.top ?? -9999,
          left: menuPosition?.left ?? -9999,
          visibility: menuPosition ? 'visible' : 'hidden'
        }}
        className="z-[100] min-w-[220px] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl"
      >
        <button type="button" className={itemClass} onClick={onViewDetails}>
          <Building2 size={15} />
          {text.viewStoreDetails}
        </button>
        <button type="button" className={itemClass} onClick={onViewSubscription}>
          <Eye size={15} />
          {text.viewSubscription}
        </button>
        <button type="button" className={itemClass} onClick={onAssignPlan}>
          <Sparkles size={15} className="text-brand-600" />
          {text.assignPlan}
        </button>
        {canRenew ? (
          <button type="button" className={itemClass} onClick={onRenew}>
            <RefreshCw size={15} className="text-brand-600" />
            {text.renewSubscription}
          </button>
        ) : null}
        <button
          type="button"
          className={`${itemClass} ${store.isActive ? 'text-red-700 hover:bg-red-50' : 'text-green-700 hover:bg-green-50'}`}
          onClick={onToggleActive}
        >
          {store.isActive ? <PowerOff size={15} /> : <Power size={15} />}
          {store.isActive ? text.deactivate : text.activate}
        </button>
        <button type="button" className={`${itemClass} text-red-700 hover:bg-red-50`} onClick={onDelete}>
          <Trash2 size={15} />
          {text.deleteStore}
        </button>
      </div>
    ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={onToggle}
        className="rounded-lg p-1.5 text-slate-600 transition hover:bg-slate-100"
        aria-label={text.storeDetails}
        aria-expanded={isOpen}
      >
        <EllipsisVertical size={16} />
      </button>
      {mounted && menu ? createPortal(menu, document.body) : null}
    </>
  );
}

function DetailField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 font-bold text-slate-900" dir="auto">
        {value?.trim() ? value : '-'}
      </p>
    </div>
  );
}

function DetailBlock({ label, value, dir }: { label: string; value: string; dir?: 'ltr' | 'rtl' | 'auto' }) {
  return (
    <div className="rounded-xl border border-slate-100 p-4">
      <p className="mb-2 text-xs font-bold text-slate-500">{label}</p>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800" dir={dir ?? 'auto'}>
        {value}
      </p>
    </div>
  );
}
