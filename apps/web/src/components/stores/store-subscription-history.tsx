'use client';

import { FileText, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import {
  StoreSubscriptionInvoiceModal,
  type StoreSubscriptionInvoiceData
} from '@/components/stores/store-subscription-invoice-modal';
import { StoreSubscriptionStatusBadge } from '@/components/stores/store-subscription-status-badge';
import { api } from '@/lib/api';
import { getBillingPeriodLabel, type StoreBillingPeriod } from '@/lib/store-billing-period';

export type StoreSubscriptionHistoryItem = StoreSubscriptionInvoiceData & {
  planId: string;
  isActive: boolean;
};

type StoreSubscriptionHistoryProps = {
  storeId: string;
  locale: 'ar' | 'en';
  activeSubscriptionId?: string | null;
  userName: string;
  storeName: string;
  authHeaders?: { Authorization: string };
  labels: {
    title: string;
    startsAt: string;
    endsAt: string;
    maxListings: string;
    loadMore: string;
    loading: string;
    empty: string;
    currentBadge: string;
    viewInvoice: string;
    invoice: {
      title: string;
      invoiceNumber: string;
      invoiceDate: string;
      secondPartyTitle: string;
      storeOwnerLabel: string;
      storeNameLabel: string;
      product: string;
      unitPrice: string;
      subtotal: string;
      vatTotal: string;
      grandTotal: string;
      free: string;
      maxListings: string;
      platformInfo: string;
      email: string;
      website: string;
      taxNumber: string;
      commercialRegistration: string;
      downloadPdf: string;
      downloading: string;
      close: string;
    };
  };
};

function formatDate(value: string | null | undefined, locale: 'ar' | 'en') {
  if (!value) return '-';
  return new Date(value).toLocaleDateString(locale === 'ar' ? 'ar-OM' : 'en-GB');
}

export function StoreSubscriptionHistory({
  storeId,
  locale,
  activeSubscriptionId,
  userName,
  storeName,
  authHeaders,
  labels
}: StoreSubscriptionHistoryProps) {
  const [items, setItems] = useState<StoreSubscriptionHistoryItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [invoiceSubscription, setInvoiceSubscription] = useState<StoreSubscriptionHistoryItem | null>(null);

  const fetchPage = useCallback(
    async (nextPage: number, append: boolean) => {
      const response = await api.get<{
        data: {
          items: StoreSubscriptionHistoryItem[];
          hasMore: boolean;
          page: number;
        };
      }>(`/stores/${storeId}/subscriptions`, {
        headers: authHeaders,
        params: { page: nextPage, limit: 2 }
      });

      const payload = response.data.data;
      setItems((current) => (append ? [...current, ...payload.items] : payload.items));
      setHasMore(payload.hasMore);
      setPage(payload.page);
    },
    [authHeaders, storeId]
  );

  useEffect(() => {
    setIsLoading(true);
    fetchPage(1, false)
      .catch(() => setItems([]))
      .finally(() => setIsLoading(false));
  }, [fetchPage]);

  const loadMore = async () => {
    if (!hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      await fetchPage(page + 1, true);
    } finally {
      setIsLoadingMore(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
        <h2 className="mb-4 text-xl font-black">{labels.title}</h2>
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
          <Loader2 size={18} className="animate-spin" />
          {labels.loading}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
        <h2 className="mb-4 text-xl font-black">{labels.title}</h2>
        <p className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500">
          {labels.empty}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
        <h2 className="mb-5 text-xl font-black">{labels.title}</h2>
        <div className="space-y-3">
          {items.map((subscription) => {
            const planName = locale === 'en' ? subscription.plan?.nameEn : subscription.plan?.nameAr;
            const isCurrent = activeSubscriptionId === subscription.id;

            return (
              <article
                key={subscription.id}
                className={`overflow-hidden rounded-2xl border transition ${
                  isCurrent ? 'border-green-200 bg-green-50/40' : 'border-gray-100 bg-white'
                }`}
              >
                <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-gray-900">{planName ?? '-'}</h3>
                      <StoreSubscriptionStatusBadge
                        status={subscription.status}
                        locale={locale}
                        isTrial={subscription.isTrial}
                      />
                      {isCurrent ? (
                        <span className="inline-flex rounded-full bg-green-600 px-2.5 py-0.5 text-xs font-bold text-white">
                          {labels.currentBadge}
                        </span>
                      ) : null}
                    </div>

                    <div className="grid gap-1 text-sm text-gray-600 sm:grid-cols-2">
                      <p>
                        {labels.startsAt}: {formatDate(subscription.startsAt, locale)}
                      </p>
                      <p>
                        {labels.endsAt}: {formatDate(subscription.endsAt, locale)}
                      </p>
                      <p>
                        {getBillingPeriodLabel(subscription.billingPeriod as StoreBillingPeriod, locale)}
                      </p>
                      <p>
                        {labels.maxListings}: {subscription.maxListings}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setInvoiceSubscription(subscription)}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-green-300 hover:bg-green-50 hover:text-green-800"
                  >
                    <FileText size={16} />
                    {labels.viewInvoice}
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {hasMore ? (
          <button
            type="button"
            onClick={loadMore}
            disabled={isLoadingMore}
            className="mt-4 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
          >
            {isLoadingMore ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                {labels.loading}
              </span>
            ) : (
              labels.loadMore
            )}
          </button>
        ) : null}
      </div>

      <StoreSubscriptionInvoiceModal
        open={Boolean(invoiceSubscription)}
        onClose={() => setInvoiceSubscription(null)}
        subscription={invoiceSubscription}
        locale={locale}
        userName={userName}
        storeName={storeName}
        labels={labels.invoice}
      />
    </>
  );
}
