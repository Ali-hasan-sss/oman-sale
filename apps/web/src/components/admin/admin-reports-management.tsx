'use client';

import { Ban, ExternalLink, Flag, Trash2, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { adminApi } from '@/lib/admin-auth';
import { useI18n } from '@/lib/i18n';

type ReportItem = {
  id: string;
  reason: string;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
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
      isActive: boolean;
      isBlocked: boolean;
    };
    category?: {
      name?: string;
      nameAr?: string;
      nameEn?: string;
    } | null;
    images?: Array<{ imageUrl: string }>;
  };
};

type ReportsResponse = {
  items: ReportItem[];
  total: number;
  page: number;
  limit: number;
};

const fallbackImage = '/logo.png';

export function AdminReportsManagement() {
  const { locale, localizedPath, m } = useI18n();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [actionId, setActionId] = useState<string>();

  const loadReports = async (nextPage = 1, append = false) => {
    setIsLoading(true);
    setError(undefined);

    try {
      const response = await adminApi().get<{ data: ReportsResponse }>('/admin/reports', {
        params: { page: nextPage, limit: 20 }
      });
      setReports((current) =>
        append ? [...current, ...response.data.data.items] : response.data.data.items
      );
      setTotal(response.data.data.total);
      setPage(response.data.data.page);
    } catch {
      setError(m.admin.reportsLoadError);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports(1).catch(() => undefined);
  }, [m.admin.reportsLoadError]);

  const dismissReport = async (reportId: string) => {
    if (!window.confirm(m.admin.reportDismissConfirm)) return;

    setActionId(reportId);
    try {
      await adminApi().delete(`/admin/reports/${reportId}`);
      await loadReports(page);
    } finally {
      setActionId(undefined);
    }
  };

  const banReportedUser = async (reportId: string) => {
    if (!window.confirm(m.admin.reportBanConfirm)) return;

    setActionId(reportId);
    try {
      await adminApi().post(`/admin/reports/${reportId}/ban-user`);
      await loadReports(page);
    } finally {
      setActionId(undefined);
    }
  };

  const hasMore = reports.length > 0 && reports.length < total;

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-black">{m.admin.reportsManagement}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {total} {m.admin.totalResults}
          </p>
        </div>
      </div>

      {error ? <div className="mb-4 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div> : null}

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 px-4 py-8 text-center font-bold text-slate-500">
          {m.admin.loading}
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center font-bold text-slate-500">
          {m.admin.reportsEmpty}
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => {
            const seller = report.ad.user;
            const image = report.ad.images?.[0]?.imageUrl;
            const categoryName =
              (locale === 'en' ? report.ad.category?.nameEn : report.ad.category?.nameAr) ||
              report.ad.category?.name ||
              '-';

            return (
              <article key={report.id} className="overflow-hidden rounded-2xl border border-slate-200">
                <div className="grid gap-4 p-4 lg:grid-cols-[120px_1fr_auto] lg:items-start">
                  <img
                    src={image || fallbackImage}
                    alt={report.ad.title}
                    className={`h-24 w-full rounded-xl object-cover lg:h-28 ${image ? '' : 'object-contain bg-slate-50 p-3'}`}
                  />

                  <div className="min-w-0 space-y-3">
                    <div className="flex flex-wrap items-start gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">
                        <Flag size={12} />
                        {m.admin.reportLabel}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                        {categoryName}
                      </span>
                      <span className="text-xs font-bold text-slate-400">
                        {new Date(report.createdAt).toLocaleString(locale === 'ar' ? 'ar-OM' : 'en-US')}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-black text-slate-900">{report.ad.title}</h3>
                      <Link
                        href={localizedPath(`/listing/${report.ad.id}`)}
                        target="_blank"
                        className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-brand-700 hover:underline"
                      >
                        {m.admin.viewListing}
                        <ExternalLink size={14} />
                      </Link>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">
                        {m.admin.reportReason}
                      </p>
                      <p className="whitespace-pre-line text-sm leading-6 text-slate-800">{report.reason}</p>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-xl border border-slate-100 p-4">
                        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                          {m.admin.reportedUser}
                        </p>
                        <div className="flex items-start gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                            <UserRound size={18} />
                          </span>
                          <div>
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
                                {seller.isBlocked ? m.admin.blocked : m.admin.notBlocked}
                              </span>
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                                  seller.isActive ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {seller.isActive ? m.admin.active : m.admin.inactive}
                              </span>
                            </div>
                            <Link
                              href={localizedPath(`/admin/users/${seller.id}`)}
                              className="mt-2 inline-block text-sm font-bold text-brand-700 hover:underline"
                            >
                              {m.admin.viewUser}
                            </Link>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-100 p-4">
                        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                          {m.admin.reporter}
                        </p>
                        <p className="font-black text-slate-900">{report.user.fullName}</p>
                        <p className="text-sm text-slate-500" dir="ltr">
                          {report.user.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row flex-wrap gap-2 lg:flex-col lg:items-stretch">
                    <button
                      type="button"
                      disabled={actionId === report.id || seller.isBlocked}
                      onClick={() => banReportedUser(report.id)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Ban size={16} />
                      {m.admin.banReportedUser}
                    </button>
                    <button
                      type="button"
                      disabled={actionId === report.id}
                      onClick={() => dismissReport(report.id)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                      <Trash2 size={16} />
                      {m.admin.dismissReport}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {hasMore ? (
        <div className="mt-6 text-center">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => loadReports(page + 1, true)}
            className="rounded-xl bg-slate-100 px-6 py-3 font-bold text-slate-700 transition hover:bg-slate-200 disabled:opacity-50"
          >
            {m.admin.loadMoreReports}
          </button>
        </div>
      ) : null}
    </section>
  );
}
