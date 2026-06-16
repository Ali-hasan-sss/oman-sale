'use client';

import { BadgeCheck, Check, ExternalLink, Store, X } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

import { AdminEntityAvatar } from '@/components/admin/admin-entity-avatar';
import { AdminPagination } from '@/components/admin/admin-pagination';
import { AdminTableSkeleton } from '@/components/admin/admin-table-skeleton';
import { adminApi } from '@/lib/admin-auth';
import { notifyAdminPendingCountsChanged } from '@/lib/admin-pending-counts';
import { useI18n } from '@/lib/i18n';

type TrustBadgeStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

type UserTrustBadgeRequest = {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  avatar?: string | null;
  trustBadgeStatus: TrustBadgeStatus;
  trustIdentityDocType?: 'NATIONAL_ID' | 'PASSPORT' | null;
  trustIdentityDocUrl?: string | null;
  trustBadgeRejectionReason?: string | null;
  trustBadgeReviewedAt?: string | null;
  updatedAt: string;
};

type StoreTrustBadgeRequest = {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  logoUrl?: string | null;
  trustBadgeStatus: TrustBadgeStatus;
  trustCommercialRegDocUrl?: string | null;
  trustOcciDocUrl?: string | null;
  trustSmeDocUrl?: string | null;
  trustOtherDocUrl?: string | null;
  trustOtherDocLabel?: string | null;
  trustBadgeRejectionReason?: string | null;
  trustBadgeReviewedAt?: string | null;
  updatedAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    phone?: string | null;
    avatar?: string | null;
  };
};

type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

const PAGE_SIZE = 10;

const labels = {
  ar: {
    page: 'صفحة',
    of: 'من',
    applicant: 'صاحب الطلب',
    store: 'المتجر',
    owner: 'مالك المتجر',
    documentType: 'نوع المستند',
    documents: 'المستندات',
    document: 'المستند',
    date: 'التاريخ',
    rejectionReason: 'سبب الرفض',
    actions: 'إجراءات',
    viewDocument: 'عرض',
    commercialReg: 'السجل التجاري',
    occi: 'شهادة الغرفة',
    sme: 'بطاقة SME',
    other: 'مستند آخر',
    nationalId: 'بطاقة الهوية',
    passport: 'جواز السفر',
    nationalIdShort: 'هوية',
    passportShort: 'جواز',
    commercialRegShort: 'س.ت',
    occiShort: 'غرفة',
    smeShort: 'SME',
    otherShort: 'أخرى',
    noPhone: '—',
    empty: 'لا توجد طلبات.',
    loading: 'جاري التحميل...'
  },
  en: {
    page: 'Page',
    of: 'of',
    applicant: 'Applicant',
    store: 'Store',
    owner: 'Store owner',
    documentType: 'Document type',
    documents: 'Documents',
    document: 'Document',
    date: 'Date',
    rejectionReason: 'Rejection reason',
    actions: 'Actions',
    viewDocument: 'View',
    commercialReg: 'Commercial registration',
    occi: 'OCCI certificate',
    sme: 'SME card',
    other: 'Other document',
    nationalId: 'National ID',
    passport: 'Passport',
    nationalIdShort: 'ID',
    passportShort: 'Passport',
    commercialRegShort: 'CR',
    occiShort: 'OCCI',
    smeShort: 'SME',
    otherShort: 'Other',
    noPhone: '—',
    empty: 'No requests found.',
    loading: 'Loading...'
  }
} as const;

function ApplicantCell({
  name,
  email,
  phone,
  avatar,
  noPhoneLabel,
  compact = false
}: {
  name: string;
  email: string;
  phone?: string | null;
  avatar?: string | null;
  noPhoneLabel: string;
  compact?: boolean;
}) {
  return (
    <div className={`flex min-w-0 items-center ${compact ? 'gap-2' : 'gap-2.5'}`}>
      <AdminEntityAvatar
        src={avatar}
        name={name}
        className={compact ? 'h-8 w-8 rounded-lg text-xs' : 'h-9 w-9 rounded-lg'}
      />
      <div className="min-w-0">
        <p className="truncate text-xs font-bold text-slate-900">{name}</p>
        <p className="truncate text-[11px] text-slate-500">{email}</p>
        <p className="truncate text-[10px] text-slate-400" dir="ltr">
          {phone || noPhoneLabel}
        </p>
      </div>
    </div>
  );
}

function DocLink({ href, label, compact = false }: { href?: string | null; label: string; compact?: boolean }) {
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={label}
      className={
        compact
          ? 'inline-flex max-w-full items-center gap-0.5 truncate rounded-md bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold text-brand-700 hover:bg-brand-100'
          : 'inline-flex items-center gap-0.5 text-[11px] font-bold text-brand-700 hover:underline'
      }
    >
      <span className="truncate">{label}</span>
      <ExternalLink size={10} className="shrink-0" />
    </a>
  );
}

function StoreDocsCell({
  request,
  text
}: {
  request: StoreTrustBadgeRequest;
  text: (typeof labels)[keyof typeof labels];
}) {
  const items = [
    { href: request.trustCommercialRegDocUrl, label: text.commercialRegShort, title: text.commercialReg },
    { href: request.trustOcciDocUrl, label: text.occiShort, title: text.occi },
    { href: request.trustSmeDocUrl, label: text.smeShort, title: text.sme },
    {
      href: request.trustOtherDocUrl,
      label: request.trustOtherDocLabel ? request.trustOtherDocLabel.slice(0, 8) : text.otherShort,
      title: request.trustOtherDocLabel || text.other
    }
  ].filter((item) => item.href);

  if (items.length === 0) return <span className="text-[11px] text-slate-400">—</span>;

  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item) => (
        <a
          key={item.href}
          href={item.href!}
          target="_blank"
          rel="noopener noreferrer"
          title={item.title}
          className="inline-flex items-center gap-0.5 rounded-md bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold text-brand-700 hover:bg-brand-100"
        >
          {item.label}
          <ExternalLink size={9} className="shrink-0" />
        </a>
      ))}
    </div>
  );
}

const thClass = 'px-2 py-2 text-start text-[11px] font-bold text-slate-500';
const tdClass = 'px-2 py-2.5 align-top';

export function AdminTrustBadgesManagement() {
  const { locale } = useI18n();
  const isAr = locale === 'ar';
  const text = labels[locale];
  const [tab, setTab] = useState<'users' | 'stores'>('users');
  const [status, setStatus] = useState<TrustBadgeStatus>('PENDING');
  const [page, setPage] = useState(1);
  const [userRequests, setUserRequests] = useState<UserTrustBadgeRequest[]>([]);
  const [storeRequests, setStoreRequests] = useState<StoreTrustBadgeRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<{ type: 'users' | 'stores'; id: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [pendingCounts, setPendingCounts] = useState({ users: 0, stores: 0 });

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  const formatDate = useCallback(
    (value: string) =>
      new Intl.DateTimeFormat(isAr ? 'ar-OM' : 'en-US', {
        day: 'numeric',
        month: 'short',
        year: '2-digit'
      }).format(new Date(value)),
    [isAr]
  );

  const showRejectionColumn = status === 'REJECTED';

  const loadPendingCounts = useCallback(async () => {
    try {
      const response = await adminApi().get<{ data: { users: number; stores: number } }>('/admin/trust-badges/pending-count');
      setPendingCounts({
        users: response.data.data.users,
        stores: response.data.data.stores
      });
    } catch {
      setPendingCounts({ users: 0, stores: 0 });
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (tab === 'users') {
        const response = await adminApi().get<{ data: Paginated<UserTrustBadgeRequest> }>('/admin/trust-badges/users', {
          params: { status, page, limit: PAGE_SIZE }
        });
        setUserRequests(response.data.data.items);
        setTotal(response.data.data.total);
      } else {
        const response = await adminApi().get<{ data: Paginated<StoreTrustBadgeRequest> }>('/admin/trust-badges/stores', {
          params: { status, page, limit: PAGE_SIZE }
        });
        setStoreRequests(response.data.data.items);
        setTotal(response.data.data.total);
      }
    } catch {
      setError(isAr ? 'تعذر تحميل طلبات التوثيق.' : 'Could not load verification requests.');
      setUserRequests([]);
      setStoreRequests([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [isAr, page, status, tab]);

  useEffect(() => {
    void loadPendingCounts();
  }, [loadPendingCounts]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    setPage(1);
  }, [tab, status]);

  const refreshAfterAction = async () => {
    notifyAdminPendingCountsChanged();
    await Promise.all([loadPendingCounts(), loadData()]);
  };

  const approve = async (type: 'users' | 'stores', id: string) => {
    setProcessingId(id);
    setError('');
    try {
      await adminApi().post(`/admin/trust-badges/${type}/${id}/approve`);
      setMessage(isAr ? 'تمت الموافقة على التوثيق.' : 'Verification approved.');
      await refreshAfterAction();
    } catch {
      setError(isAr ? 'تعذر الموافقة على الطلب.' : 'Could not approve request.');
    } finally {
      setProcessingId(null);
    }
  };

  const reject = async (event: FormEvent) => {
    event.preventDefault();
    if (!rejectTarget || !rejectReason.trim()) return;

    setProcessingId(rejectTarget.id);
    setError('');
    try {
      await adminApi().post(`/admin/trust-badges/${rejectTarget.type}/${rejectTarget.id}/reject`, {
        reason: rejectReason.trim()
      });
      setRejectTarget(null);
      setRejectReason('');
      setMessage(isAr ? 'تم رفض طلب التوثيق.' : 'Verification request rejected.');
      await refreshAfterAction();
    } catch {
      setError(isAr ? 'تعذر رفض الطلب.' : 'Could not reject request.');
    } finally {
      setProcessingId(null);
    }
  };

  const statusFilters: TrustBadgeStatus[] = ['PENDING', 'APPROVED', 'REJECTED'];
  const statusLabels = {
    PENDING: isAr ? 'قيد المراجعة' : 'Pending',
    APPROVED: isAr ? 'موثّق' : 'Approved',
    REJECTED: isAr ? 'مرفوض' : 'Rejected'
  };

  const renderTabBadge = (count: number) =>
    count > 0 ? (
      <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-black leading-none text-white">
        {count > 99 ? '99+' : count}
      </span>
    ) : null;

  const actionButtons = (type: 'users' | 'stores', id: string) =>
    status === 'PENDING' ? (
      <div className="flex flex-col gap-1">
        <button
          type="button"
          disabled={processingId === id}
          onClick={() => approve(type, id)}
          title={isAr ? 'موافقة' : 'Approve'}
          className="inline-flex items-center justify-center gap-1 rounded-md bg-green-600 px-2 py-1.5 text-[10px] font-bold text-white hover:bg-green-700 disabled:opacity-60"
        >
          <Check size={12} />
          <span>{isAr ? 'قبول' : 'OK'}</span>
        </button>
        <button
          type="button"
          disabled={processingId === id}
          onClick={() => setRejectTarget({ type, id })}
          title={isAr ? 'رفض' : 'Reject'}
          className="inline-flex items-center justify-center gap-1 rounded-md bg-red-50 px-2 py-1.5 text-[10px] font-bold text-red-700 hover:bg-red-100 disabled:opacity-60"
        >
          <X size={12} />
          <span>{isAr ? 'رفض' : 'No'}</span>
        </button>
      </div>
    ) : (
      <span className="text-[11px] text-slate-400">—</span>
    );

  const isEmpty = tab === 'users' ? userRequests.length === 0 : storeRequests.length === 0;

  return (
    <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100">
      <div className="border-b border-slate-100 p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-[#1D9BF0]">
            <BadgeCheck size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">{isAr ? 'طلبات التوثيق' : 'Verification requests'}</h2>
            <p className="text-sm text-slate-500">
              {isAr ? 'مراجعة مستندات الحسابات والمتاجر لمنح شارة الموثوقية' : 'Review account and store documents for the verified badge'}
            </p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTab('users')}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${
              tab === 'users' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {isAr ? 'حسابات شخصية' : 'Personal accounts'}
            {renderTabBadge(pendingCounts.users)}
          </button>
          <button
            type="button"
            onClick={() => setTab('stores')}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${
              tab === 'stores' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {isAr ? 'متاجر' : 'Stores'}
            {renderTabBadge(pendingCounts.stores)}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {statusFilters.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setStatus(item)}
              className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                status === item ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {statusLabels[item]}
            </button>
          ))}
        </div>
      </div>

      {message ? <p className="border-b border-green-100 bg-green-50 px-6 py-3 text-sm font-bold text-green-700">{message}</p> : null}
      {error ? <p className="border-b border-red-100 bg-red-50 px-6 py-3 text-sm font-bold text-red-600">{error}</p> : null}

      <div>
        {tab === 'users' ? (
          <table className="w-full table-fixed text-xs">
            <colgroup>
              <col className={showRejectionColumn ? 'w-[30%]' : 'w-[34%]'} />
              <col className="w-[12%]" />
              <col className="w-[10%]" />
              <col className="w-[12%]" />
              {showRejectionColumn ? <col className="w-[20%]" /> : null}
              <col className={showRejectionColumn ? 'w-[16%]' : 'w-[32%]'} />
            </colgroup>
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                <th className={thClass}>{text.applicant}</th>
                <th className={thClass}>{text.documentType}</th>
                <th className={thClass}>{text.document}</th>
                <th className={thClass}>{text.date}</th>
                {showRejectionColumn ? <th className={thClass}>{text.rejectionReason}</th> : null}
                <th className={thClass}>{text.actions}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <AdminTableSkeleton
                  asBodyOnly
                  rows={PAGE_SIZE}
                  columnTypes={
                    showRejectionColumn
                      ? ['avatar-text', 'badge', 'text', 'text', 'text', 'actions']
                      : ['avatar-text', 'badge', 'text', 'text', 'actions']
                  }
                />
              ) : isEmpty ? (
                <tr>
                  <td colSpan={showRejectionColumn ? 6 : 5} className="px-2 py-10 text-center font-bold text-slate-500">
                    {text.empty}
                  </td>
                </tr>
              ) : (
                userRequests.map((request) => (
                  <tr key={request.id} className="border-b border-slate-100">
                    <td className={tdClass}>
                      <ApplicantCell
                        name={request.fullName}
                        email={request.email}
                        phone={request.phone}
                        avatar={request.avatar}
                        noPhoneLabel={text.noPhone}
                        compact
                      />
                    </td>
                    <td className={tdClass}>
                      <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                        {request.trustIdentityDocType === 'PASSPORT' ? text.passportShort : text.nationalIdShort}
                      </span>
                    </td>
                    <td className={tdClass}>
                      <DocLink href={request.trustIdentityDocUrl} label={text.viewDocument} />
                    </td>
                    <td className={`${tdClass} text-[11px] text-slate-600`}>{formatDate(request.updatedAt)}</td>
                    {showRejectionColumn ? (
                      <td className={`${tdClass} line-clamp-2 text-[11px] text-red-600`}>
                        {request.trustBadgeRejectionReason || '—'}
                      </td>
                    ) : null}
                    <td className={tdClass}>{actionButtons('users', request.id)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : (
          <table className="w-full table-fixed text-xs">
            <colgroup>
              <col className={showRejectionColumn ? 'w-[18%]' : 'w-[20%]'} />
              <col className={showRejectionColumn ? 'w-[24%]' : 'w-[28%]'} />
              <col className={showRejectionColumn ? 'w-[18%]' : 'w-[22%]'} />
              <col className="w-[12%]" />
              {showRejectionColumn ? <col className="w-[16%]" /> : null}
              <col className={showRejectionColumn ? 'w-[12%]' : 'w-[18%]'} />
            </colgroup>
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                <th className={thClass}>{text.store}</th>
                <th className={thClass}>{text.owner}</th>
                <th className={thClass}>{text.documents}</th>
                <th className={thClass}>{text.date}</th>
                {showRejectionColumn ? <th className={thClass}>{text.rejectionReason}</th> : null}
                <th className={thClass}>{text.actions}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <AdminTableSkeleton
                  asBodyOnly
                  rows={PAGE_SIZE}
                  columnTypes={
                    showRejectionColumn
                      ? ['avatar-text', 'avatar-text', 'text', 'text', 'text', 'actions']
                      : ['avatar-text', 'avatar-text', 'text', 'text', 'actions']
                  }
                />
              ) : isEmpty ? (
                <tr>
                  <td colSpan={showRejectionColumn ? 6 : 5} className="px-2 py-10 text-center font-bold text-slate-500">
                    {text.empty}
                  </td>
                </tr>
              ) : (
                storeRequests.map((request) => {
                  const storeName = isAr ? request.nameAr : request.nameEn;

                  return (
                    <tr key={request.id} className="border-b border-slate-100">
                      <td className={tdClass}>
                        <div className="flex min-w-0 items-center gap-2">
                          <AdminEntityAvatar src={request.logoUrl} name={storeName} className="h-8 w-8 rounded-lg text-xs" />
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-slate-900">{storeName}</p>
                            <p className="flex items-center gap-0.5 truncate text-[10px] text-slate-400">
                              <Store size={10} className="shrink-0" />
                              {request.slug}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className={tdClass}>
                        <ApplicantCell
                          name={request.user.fullName}
                          email={request.user.email}
                          phone={request.user.phone}
                          avatar={request.user.avatar}
                          noPhoneLabel={text.noPhone}
                          compact
                        />
                      </td>
                      <td className={tdClass}>
                        <StoreDocsCell request={request} text={text} />
                      </td>
                      <td className={`${tdClass} text-[11px] text-slate-600`}>{formatDate(request.updatedAt)}</td>
                      {showRejectionColumn ? (
                        <td className={`${tdClass} line-clamp-2 text-[11px] text-red-600`}>
                          {request.trustBadgeRejectionReason || '—'}
                        </td>
                      ) : null}
                      <td className={tdClass}>{actionButtons('stores', request.id)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {!loading && total > 0 ? (
        <AdminPagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          labels={{
            previous: isAr ? 'السابق' : 'Previous',
            next: isAr ? 'التالي' : 'Next',
            page: text.page,
            of: text.of
          }}
        />
      ) : null}

      {rejectTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <form onSubmit={reject} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="mb-4 text-xl font-black text-slate-900">{isAr ? 'رفض طلب التوثيق' : 'Reject verification'}</h3>
            <label className="mb-4 block">
              <span className="mb-2 block text-sm font-bold text-slate-700">{isAr ? 'سبب الرفض' : 'Rejection reason'}</span>
              <textarea
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                className="min-h-28 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                required
              />
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setRejectTarget(null);
                  setRejectReason('');
                }}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 font-bold text-slate-700"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={!rejectReason.trim() || processingId === rejectTarget.id}
                className="flex-1 rounded-xl bg-red-600 px-4 py-3 font-bold text-white disabled:opacity-60"
              >
                {isAr ? 'تأكيد الرفض' : 'Confirm reject'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
