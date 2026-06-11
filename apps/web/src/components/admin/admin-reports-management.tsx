'use client';

import { Ban, ExternalLink, Eye, Flag, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { AdminAdMediaPreview, AdminAdMediaThumb } from '@/components/admin/admin-ad-media';
import { AdminAdViewModal } from '@/components/admin/admin-ad-view-modal';
import { AdminEntityAvatar } from '@/components/admin/admin-entity-avatar';
import { AdminTableSkeleton } from '@/components/admin/admin-table-skeleton';
import { adminApi } from '@/lib/admin-auth';
import { notifyAdminPendingCountsChanged } from '@/lib/admin-pending-counts';
import { useI18n } from '@/lib/i18n';

type ReportItem = {
  id: string;
  reason: string;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    avatar?: string | null;
  };
  ad: {
    id: string;
    title: string;
    slug: string;
    status: string;
    isActive: boolean;
    userId: string;
    user: {
      id: string;
      fullName: string;
      email: string;
      phone?: string | null;
      avatar?: string | null;
      isActive: boolean;
      isBlocked: boolean;
    };
    category?: {
      name?: string;
      nameAr?: string;
      nameEn?: string;
    } | null;
    images?: Array<{ imageUrl: string; mediaType?: string }>;
  };
};

type ReportsResponse = {
  items: ReportItem[];
  total: number;
  page: number;
  limit: number;
};

const pageSize = 20;

export function AdminReportsManagement() {
  const { locale, localizedPath, m } = useI18n();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [actionId, setActionId] = useState<string>();
  const [viewingAdId, setViewingAdId] = useState<string | null>(null);
  const [viewingReport, setViewingReport] = useState<ReportItem | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const loadReports = async (nextPage = page) => {
    setIsLoading(true);
    setError(undefined);

    try {
      const response = await adminApi().get<{ data: ReportsResponse }>('/admin/reports', {
        params: { page: nextPage, limit: pageSize }
      });
      setReports(response.data.data.items);
      setTotal(response.data.data.total);
      setPage(response.data.data.page);
    } catch {
      setError(m.admin.reportsLoadError);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports(page).catch(() => undefined);
  }, [page, m.admin.reportsLoadError]);

  const dismissReport = async (reportId: string) => {
    if (!window.confirm(m.admin.reportDismissConfirm)) return;

    setActionId(reportId);
    try {
      await adminApi().delete(`/admin/reports/${reportId}`);
      setViewingReport((current) => (current?.id === reportId ? null : current));
      await loadReports(page);
      notifyAdminPendingCountsChanged();
    } finally {
      setActionId(undefined);
    }
  };

  const banReportedUser = async (reportId: string) => {
    if (!window.confirm(m.admin.reportBanConfirm)) return;

    setActionId(reportId);
    try {
      await adminApi().post(`/admin/reports/${reportId}/ban-user`);
      setViewingReport((current) => (current?.id === reportId ? null : current));
      await loadReports(page);
      notifyAdminPendingCountsChanged();
    } finally {
      setActionId(undefined);
    }
  };

  const categoryName = (report: ReportItem) => {
    const category = report.ad.category;
    if (!category) return '-';
    if (locale === 'en') return category.nameEn || category.name || '-';
    return category.nameAr || category.name || '-';
  };

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-black">{m.admin.reportsManagement}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {total.toLocaleString(locale === 'ar' ? 'ar-OM' : 'en-US')} {m.admin.totalResults}
          </p>
        </div>
      </div>

      {error ? <div className="mb-4 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div> : null}

      <div>
        <table className="w-full table-fixed text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-[11px] text-slate-500">
              <th className="w-[34%] px-3 py-2 text-start font-bold">{m.admin.ads}</th>
              <th className="w-[22%] px-3 py-2 text-start font-bold">{m.admin.reportedUser}</th>
              <th className="w-[22%] px-3 py-2 text-start font-bold">{m.admin.reporter}</th>
              <th className="w-[16%] px-3 py-2 text-start font-bold">{m.admin.reportDate}</th>
              <th className="w-[6%] px-3 py-2 text-center font-bold">{m.admin.actions}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <AdminTableSkeleton
                asBodyOnly
                rows={10}
                columnTypes={['avatar-text', 'avatar-text', 'avatar-text', 'text', 'short']}
              />
            ) : reports.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center font-bold text-slate-500">
                  {m.admin.reportsEmpty}
                </td>
              </tr>
            ) : (
              reports.map((report) => {
                const seller = report.ad.user;

                return (
                  <tr key={report.id} className="border-b border-slate-100">
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => setViewingAdId(report.ad.id)}
                        className="flex w-full min-w-0 items-center gap-2 text-start transition hover:opacity-80"
                      >
                        <AdminAdMediaThumb images={report.ad.images} alt={report.ad.title} />
                        <div className="min-w-0">
                          <p className="truncate font-bold text-slate-900">{report.ad.title}</p>
                          <p className="truncate text-[10px] text-slate-500">{categoryName(report)}</p>
                        </div>
                      </button>
                    </td>
                    <td className="px-3 py-2">
                      <Link
                        href={localizedPath(`/admin/users/${seller.id}`)}
                        title={m.admin.viewUser}
                        className="flex min-w-0 items-center gap-2 transition hover:opacity-80"
                      >
                        <AdminEntityAvatar src={seller.avatar} name={seller.fullName} className="h-9 w-9 rounded-lg" />
                        <p className="truncate font-bold text-slate-900">{seller.fullName}</p>
                      </Link>
                    </td>
                    <td className="px-3 py-2">
                      <Link
                        href={localizedPath(`/admin/users/${report.user.id}`)}
                        title={m.admin.viewUser}
                        className="flex min-w-0 items-center gap-2 transition hover:opacity-80"
                      >
                        <AdminEntityAvatar src={report.user.avatar} name={report.user.fullName} className="h-9 w-9 rounded-lg" />
                        <p className="truncate font-bold text-slate-900">{report.user.fullName}</p>
                      </Link>
                    </td>
                    <td className="truncate px-3 py-2 text-slate-500">
                      {new Intl.DateTimeFormat(locale === 'ar' ? 'ar-OM' : 'en-US', {
                        dateStyle: 'short'
                      }).format(new Date(report.createdAt))}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => setViewingReport(report)}
                        title={m.admin.viewReport}
                        aria-label={m.admin.viewReport}
                        className="inline-flex rounded-md bg-slate-100 p-1.5 text-slate-700 transition hover:bg-slate-200"
                      >
                        <Eye size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!isLoading && totalPages > 1 ? (
        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
          <p className="text-sm font-bold text-slate-500">
            {m.admin.page} {page} {m.admin.of} {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="rounded-xl border border-slate-200 px-4 py-2 font-bold disabled:opacity-50"
            >
              {m.admin.previous}
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              className="rounded-xl border border-slate-200 px-4 py-2 font-bold disabled:opacity-50"
            >
              {m.admin.next}
            </button>
          </div>
        </div>
      ) : null}

      {viewingAdId ? (
        <AdminAdViewModal
          adId={viewingAdId}
          onClose={() => setViewingAdId(null)}
          onChanged={() => loadReports(page)}
        />
      ) : null}

      {viewingReport ? (
        <ReportDetailModal
          report={viewingReport}
          locale={locale}
          localizedPath={localizedPath}
          labels={m.admin}
          actionId={actionId}
          onClose={() => setViewingReport(null)}
          onDismiss={() => dismissReport(viewingReport.id)}
          onBan={() => banReportedUser(viewingReport.id)}
        />
      ) : null}
    </section>
  );
}

function ReportDetailModal({
  report,
  locale,
  localizedPath,
  labels,
  actionId,
  onClose,
  onDismiss,
  onBan
}: {
  report: ReportItem;
  locale: 'ar' | 'en';
  localizedPath: (path: string) => string;
  labels: ReturnType<typeof useI18n>['m']['admin'];
  actionId?: string;
  onClose: () => void;
  onDismiss: () => void;
  onBan: () => void;
}) {
  const seller = report.ad.user;
  const category =
    (locale === 'en' ? report.ad.category?.nameEn : report.ad.category?.nameAr) ||
    report.ad.category?.name ||
    '-';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">
              <Flag size={12} />
              {labels.reportLabel}
            </span>
            <span className="text-xs font-bold text-slate-400">
              {new Date(report.createdAt).toLocaleString(locale === 'ar' ? 'ar-OM' : 'en-US')}
            </span>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 transition hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[120px_1fr]">
          <AdminAdMediaPreview
            images={report.ad.images}
            alt={report.ad.title}
            className="h-28 w-full rounded-xl object-cover"
          />
          <div>
            <h3 className="text-lg font-black text-slate-900">{report.ad.title}</h3>
            <p className="mt-1 text-sm text-slate-500">{category}</p>
            <Link
              href={localizedPath(`/listing/${report.ad.id}`)}
              target="_blank"
              className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-brand-700 hover:underline"
            >
              {labels.viewListing}
              <ExternalLink size={14} />
            </Link>
          </div>
        </div>

        <div className="mt-5 rounded-xl bg-slate-50 p-4">
          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">{labels.reportReason}</p>
          <p className="whitespace-pre-line text-sm leading-6 text-slate-800">{report.reason}</p>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-slate-100 p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">{labels.reportedUser}</p>
            <div className="flex items-start gap-3">
              <AdminEntityAvatar src={seller.avatar} name={seller.fullName} className="h-10 w-10 rounded-full" />
              <div className="min-w-0">
                <p className="font-black text-slate-900">{seller.fullName}</p>
                <p className="text-sm text-slate-500" dir="ltr">
                  {seller.email}
                </p>
                {seller.phone ? (
                  <p className="text-sm text-slate-500" dir="ltr">
                    {seller.phone}
                  </p>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      seller.isBlocked ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                    }`}
                  >
                    {seller.isBlocked ? labels.blocked : labels.notBlocked}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      seller.isActive ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {seller.isActive ? labels.active : labels.inactive}
                  </span>
                </div>
                <Link
                  href={localizedPath(`/admin/users/${seller.id}`)}
                  className="mt-2 inline-block text-sm font-bold text-brand-700 hover:underline"
                >
                  {labels.viewUser}
                </Link>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">{labels.reporter}</p>
            <div className="flex items-start gap-3">
              <AdminEntityAvatar src={report.user.avatar} name={report.user.fullName} className="h-10 w-10 rounded-full" />
              <div className="min-w-0">
                <p className="font-black text-slate-900">{report.user.fullName}</p>
                <p className="text-sm text-slate-500" dir="ltr">
                  {report.user.email}
                </p>
                <Link
                  href={localizedPath(`/admin/users/${report.user.id}`)}
                  className="mt-2 inline-block text-sm font-bold text-brand-700 hover:underline"
                >
                  {labels.viewUser}
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={actionId === report.id || seller.isBlocked}
            onClick={onBan}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Ban size={16} />
            {labels.banReportedUser}
          </button>
          <button
            type="button"
            disabled={actionId === report.id}
            onClick={onDismiss}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <Trash2 size={16} />
            {labels.dismissReport}
          </button>
        </div>
      </div>
    </div>
  );
}
