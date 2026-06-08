'use client';

import Link from 'next/link';
import {
  BadgeDollarSign,
  Building2,
  Flag,
  Image,
  Megaphone,
  Store,
  TrendingUp,
  Users
} from 'lucide-react';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

import { adminApi } from '@/lib/admin-auth';
import { useI18n } from '@/lib/i18n';

type StatusCount = { status: string; count: number };
type SourceAmount = { source: string; amount: number };

type AdminStatistics = {
  summary: {
    users: number;
    newUsersLast30Days: number;
    ads: number;
    activeAds: number;
    pendingAds: number;
    stores: number;
    activeStores: number;
    reports: number;
    payments: number;
    paymentsPaid: number;
    paymentsPending: number;
    paymentsFailed: number;
    revenueTotal: number;
    revenueLast30Days: number;
    revenueStoreSubscriptions: number;
    revenuePromotions: number;
    revenueBanners: number;
    storeSubscriptionsActive: number;
    storeSubscriptionsPending: number;
    storeSubscriptionsExpired: number;
    storeSubscriptionsTrial: number;
    bannerRequestsTotal: number;
    bannerRequestsPendingApproval: number;
    bannerRequestsActive: number;
  };
  trends: {
    labels: string[];
    users: number[];
    ads: number[];
    reports: number[];
    revenue: number[];
    storeSubscriptions: number[];
    bannerRequests: number[];
  };
  breakdown: {
    adsByStatus: StatusCount[];
    subscriptionsByStatus: StatusCount[];
    bannerRequestsByStatus: StatusCount[];
    revenueBySource: SourceAmount[];
  };
  pending: {
    reports: number;
    pendingAds: number;
    bannerRequestsPendingApproval: number;
    inactiveStores: number;
    subscriptionsExpiringSoon: number;
  };
};

const CHART_COLORS = ['#059669', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#f97316', '#06b6d4', '#64748b'];

export function AdminDashboard() {
  const { locale, dir, localizedPath, m } = useI18n();
  const [stats, setStats] = useState<AdminStatistics>();
  const [error, setError] = useState<string>();
  const dateLocale = locale === 'ar' ? 'ar-OM' : 'en-US';
  const isRtl = dir === 'rtl';

  useEffect(() => {
    adminApi()
      .get<{ data: AdminStatistics }>('/admin/statistics')
      .then((response) => setStats(response.data.data))
      .catch(() => setError(m.admin.statsError));
  }, [m.admin.statsError]);

  const formatCount = (value: number) => value.toLocaleString(dateLocale);
  const formatOmr = (value: number) =>
    `${value.toLocaleString(dateLocale, { minimumFractionDigits: 3, maximumFractionDigits: 3 })} ${locale === 'ar' ? 'ر.ع' : 'OMR'}`;

  const formatShortDate = (isoDate: string) => {
    const date = new Date(`${isoDate}T00:00:00`);
    return date.toLocaleDateString(dateLocale, { month: 'short', day: 'numeric' });
  };

  const statusLabel = (status: string) => {
    const labels = m.admin.dashboardStatusLabels as Record<string, string>;
    return labels[status] ?? status;
  };

  const sourceLabel = (source: string) => {
    const labels = m.admin.dashboardSourceLabels as Record<string, string>;
    return labels[source] ?? source;
  };

  const trendData = useMemo(() => {
    if (!stats) return [];
    return stats.trends.labels.map((label, index) => ({
      date: formatShortDate(label),
      users: stats.trends.users[index] ?? 0,
      ads: stats.trends.ads[index] ?? 0,
      reports: stats.trends.reports[index] ?? 0,
      revenue: stats.trends.revenue[index] ?? 0,
      storeSubscriptions: stats.trends.storeSubscriptions[index] ?? 0,
      bannerRequests: stats.trends.bannerRequests[index] ?? 0
    }));
  }, [stats, dateLocale]);

  const revenuePieData = useMemo(() => {
    if (!stats) return [];
    return stats.breakdown.revenueBySource.map((item) => ({
      name: sourceLabel(item.source),
      value: item.amount
    }));
  }, [stats, locale]);

  const kpiCards = stats
    ? [
        {
          key: 'users',
          label: m.admin.users,
          value: formatCount(stats.summary.users),
          hint: `${m.admin.newUsers}: ${formatCount(stats.summary.newUsersLast30Days)}`,
          icon: Users,
          color: 'bg-blue-50 text-blue-600'
        },
        {
          key: 'revenue',
          label: m.admin.revenueTotal,
          value: formatOmr(stats.summary.revenueTotal),
          hint: `${m.admin.revenueLast30Days}: ${formatOmr(stats.summary.revenueLast30Days)}`,
          icon: BadgeDollarSign,
          color: 'bg-brand-50 text-brand-700'
        },
        {
          key: 'subscriptions',
          label: m.admin.storeSubscriptionsActive,
          value: formatCount(stats.summary.storeSubscriptionsActive),
          hint: `${m.admin.storeSubscriptionsTrial}: ${formatCount(stats.summary.storeSubscriptionsTrial)}`,
          icon: Store,
          color: 'bg-purple-50 text-purple-600'
        },
        {
          key: 'ads',
          label: m.admin.activeAds,
          value: formatCount(stats.summary.activeAds),
          hint: `${m.admin.total}: ${formatCount(stats.summary.ads)}`,
          icon: Megaphone,
          color: 'bg-amber-50 text-amber-600'
        },
        {
          key: 'stores',
          label: m.admin.activeStores,
          value: formatCount(stats.summary.activeStores),
          hint: `${m.admin.total}: ${formatCount(stats.summary.stores)}`,
          icon: Building2,
          color: 'bg-cyan-50 text-cyan-600'
        },
        {
          key: 'reports',
          label: m.admin.reports,
          value: formatCount(stats.summary.reports),
          hint: `${m.admin.paymentsPaid}: ${formatCount(stats.summary.paymentsPaid)}`,
          icon: Flag,
          color: 'bg-red-50 text-red-600'
        },
        {
          key: 'banners',
          label: m.admin.bannerRequests,
          value: formatCount(stats.summary.bannerRequestsTotal),
          hint: `${m.admin.bannerRequestsPending}: ${formatCount(stats.summary.bannerRequestsPendingApproval)}`,
          icon: Image,
          color: 'bg-orange-50 text-orange-600'
        },
        {
          key: 'payments',
          label: m.admin.payments,
          value: formatCount(stats.summary.payments),
          hint: `${m.admin.paymentsPending}: ${formatCount(stats.summary.paymentsPending)}`,
          icon: TrendingUp,
          color: 'bg-slate-100 text-slate-700'
        }
      ]
    : [];

  const pendingItems = stats
    ? [
        { label: m.admin.pendingReports, count: stats.pending.reports, href: '/admin/reports' },
        { label: m.admin.pendingAdsReview, count: stats.pending.pendingAds, href: '/admin/ads' },
        { label: m.admin.pendingBannerRequests, count: stats.pending.bannerRequestsPendingApproval, href: '/admin/hero' },
        { label: m.admin.pendingInactiveStores, count: stats.pending.inactiveStores, href: '/admin/stores' },
        {
          label: m.admin.pendingExpiringSubscriptions,
          count: stats.pending.subscriptionsExpiringSoon,
          href: '/admin/stores'
        }
      ].filter((item) => item.count > 0)
    : [];

  const tooltipStyle = {
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 10px 30px -15px rgb(15 23 42 / 0.35)'
  };

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-gradient-to-br from-brand-700 to-brand-900 p-8 text-white shadow-soft">
        <p className="mb-2 text-sm font-bold text-white/75">{m.admin.welcome}</p>
        <h2 className="mb-3 text-3xl font-black">{m.admin.dashboardHeroTitle}</h2>
        <p className="max-w-2xl text-white/80">{m.admin.dashboardHeroText}</p>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
      ) : null}

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.key} className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${item.color}`}>
                  <Icon size={22} />
                </div>
                <span className="text-xs font-bold text-slate-400">{m.admin.statsPeriod}</span>
              </div>
              <p className="text-sm font-bold text-slate-500">{item.label}</p>
              <p className="mt-2 text-2xl font-black text-slate-900">{stats ? item.value : '...'}</p>
              <p className="mt-2 text-xs text-slate-500">{stats ? item.hint : ''}</p>
            </article>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <article className="rounded-3xl bg-white p-6 shadow-sm xl:col-span-2">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-black text-slate-900">{m.admin.trendRevenue}</h3>
              <p className="text-sm text-slate-500">{m.admin.statsPeriod}</p>
            </div>
          </div>
          <div className="h-80">
            {stats ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 8, right: isRtl ? 0 : 8, left: isRtl ? 8 : 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} reversed={isRtl} />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    orientation={isRtl ? 'right' : 'left'}
                    tickFormatter={(value) => Number(value).toFixed(2)}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value) => [formatOmr(Number(value ?? 0)), m.admin.revenue]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#059669"
                    strokeWidth={3}
                    fill="url(#revenueGradient)"
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <ChartSkeleton />
            )}
          </div>
        </article>

        <article className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-xl font-black text-slate-900">{m.admin.breakdownRevenue}</h3>
            <p className="text-sm text-slate-500">{m.admin.revenueTotal}</p>
          </div>
          <div className="h-80">
            {stats && revenuePieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenuePieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={62}
                    outerRadius={98}
                    paddingAngle={3}
                  >
                    {revenuePieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(value) => formatOmr(Number(value ?? 0))} />
                  <Legend verticalAlign="bottom" height={48} />
                </PieChart>
              </ResponsiveContainer>
            ) : stats ? (
              <EmptyChart message={m.admin.noChartData} />
            ) : (
              <ChartSkeleton />
            )}
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <article className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-xl font-black text-slate-900">{m.admin.trendActivity}</h3>
            <p className="text-sm text-slate-500">{m.admin.statsPeriod}</p>
          </div>
          <div className="h-80">
            {stats ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 8, right: isRtl ? 0 : 8, left: isRtl ? 8 : 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} reversed={isRtl} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} orientation={isRtl ? 'right' : 'left'} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Line type="monotone" dataKey="users" name={m.admin.newUsers} stroke="#3b82f6" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="ads" name={m.admin.ads} stroke="#f59e0b" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <ChartSkeleton />
            )}
          </div>
        </article>

        <article className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-xl font-black text-slate-900">{m.admin.trendReports}</h3>
            <p className="text-sm text-slate-500">{m.admin.statsPeriod}</p>
          </div>
          <div className="h-80">
            {stats ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData} margin={{ top: 8, right: isRtl ? 0 : 8, left: isRtl ? 8 : 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} reversed={isRtl} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} orientation={isRtl ? 'right' : 'left'} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="reports" name={m.admin.reports} fill="#ef4444" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ChartSkeleton />
            )}
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <BreakdownBarChart
          title={m.admin.breakdownSubscriptions}
          subtitle={m.admin.storeSubscriptions}
          data={stats?.breakdown.subscriptionsByStatus.map((item) => ({
            name: statusLabel(item.status),
            count: item.count
          }))}
          loading={!stats}
          isRtl={isRtl}
          tooltipStyle={tooltipStyle}
          emptyMessage={m.admin.noChartData}
        />
        <BreakdownBarChart
          title={m.admin.breakdownBanners}
          subtitle={m.admin.bannerRequests}
          data={stats?.breakdown.bannerRequestsByStatus.map((item) => ({
            name: statusLabel(item.status),
            count: item.count
          }))}
          loading={!stats}
          isRtl={isRtl}
          tooltipStyle={tooltipStyle}
          emptyMessage={m.admin.noChartData}
          color="#f97316"
        />
        <BreakdownBarChart
          title={m.admin.breakdownAds}
          subtitle={m.admin.ads}
          data={stats?.breakdown.adsByStatus.map((item) => ({
            name: statusLabel(item.status),
            count: item.count
          }))}
          loading={!stats}
          isRtl={isRtl}
          tooltipStyle={tooltipStyle}
          emptyMessage={m.admin.noChartData}
          color="#f59e0b"
        />
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <article className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-xl font-black text-slate-900">{m.admin.trendSubscriptions}</h3>
            <p className="text-sm text-slate-500">{m.admin.statsPeriod}</p>
          </div>
          <div className="h-72">
            {stats ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 8, right: isRtl ? 0 : 8, left: isRtl ? 8 : 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} reversed={isRtl} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} orientation={isRtl ? 'right' : 'left'} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line
                    type="monotone"
                    dataKey="storeSubscriptions"
                    name={m.admin.storeSubscriptions}
                    stroke="#8b5cf6"
                    strokeWidth={2.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <ChartSkeleton />
            )}
          </div>
        </article>

        <article className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-xl font-black text-slate-900">{m.admin.trendBanners}</h3>
            <p className="text-sm text-slate-500">{m.admin.statsPeriod}</p>
          </div>
          <div className="h-72">
            {stats ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 8, right: isRtl ? 0 : 8, left: isRtl ? 8 : 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} reversed={isRtl} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} orientation={isRtl ? 'right' : 'left'} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line
                    type="monotone"
                    dataKey="bannerRequests"
                    name={m.admin.bannerRequests}
                    stroke="#f97316"
                    strokeWidth={2.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <ChartSkeleton />
            )}
          </div>
        </article>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-xl font-black text-slate-900">{m.admin.pendingActions}</h3>
        {stats && pendingItems.length === 0 ? (
          <p className="rounded-2xl bg-brand-50 px-4 py-3 text-sm font-bold text-brand-700">{m.admin.noPendingActions}</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {!stats
              ? Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
                ))
              : pendingItems.map((item) => (
                  <Link
                    key={item.label}
                    href={localizedPath(item.href)}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 transition hover:border-brand-200 hover:bg-brand-50"
                  >
                    <span className="text-sm font-bold text-slate-700">{item.label}</span>
                    <span className="rounded-full bg-white px-3 py-1 text-sm font-black text-brand-700 shadow-sm">
                      {formatCount(item.count)}
                    </span>
                  </Link>
                ))}
          </div>
        )}
      </section>
    </div>
  );
}

function BreakdownBarChart({
  title,
  subtitle,
  data,
  loading,
  isRtl,
  tooltipStyle,
  emptyMessage,
  color = '#059669'
}: {
  title: string;
  subtitle: string;
  data?: Array<{ name: string; count: number }>;
  loading: boolean;
  isRtl: boolean;
  tooltipStyle: CSSProperties;
  emptyMessage: string;
  color?: string;
}) {
  return (
    <article className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-xl font-black text-slate-900">{title}</h3>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>
      <div className="h-72">
        {loading ? (
          <ChartSkeleton />
        ) : data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: isRtl ? 0 : 16, left: isRtl ? 16 : 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 12 }} reversed={isRtl} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={92}
                tick={{ fill: '#64748b', fontSize: 11 }}
                orientation={isRtl ? 'right' : 'left'}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill={color} radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart message={emptyMessage} />
        )}
      </div>
    </article>
  );
}

function ChartSkeleton() {
  return <div className="h-full animate-pulse rounded-2xl bg-slate-100" />;
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 text-center text-sm font-bold text-slate-500">
      {message}
    </div>
  );
}
