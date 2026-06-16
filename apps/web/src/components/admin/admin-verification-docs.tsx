'use client';

import { ExternalLink } from 'lucide-react';

import { useI18n } from '@/lib/i18n';

function DocLink({ href, label }: { href?: string | null; label: string }) {
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-xl bg-brand-50 px-3 py-2 text-sm font-bold text-brand-700 hover:bg-brand-100"
    >
      {label}
      <ExternalLink size={14} className="shrink-0" />
    </a>
  );
}

type UserTrustDocsProps = {
  trustIdentityDocType?: 'NATIONAL_ID' | 'PASSPORT' | null;
  trustIdentityDocUrl?: string | null;
  trustBadgeStatus?: string;
  trustBadgeRejectionReason?: string | null;
};

export function AdminUserVerificationDocs({
  trustIdentityDocType,
  trustIdentityDocUrl,
  trustBadgeStatus,
  trustBadgeRejectionReason
}: UserTrustDocsProps) {
  const { m } = useI18n();
  const tb = m.trustBadge;
  const hasDocs = Boolean(trustIdentityDocUrl);
  const hasStatus = trustBadgeStatus && trustBadgeStatus !== 'NONE';

  if (!hasDocs && !hasStatus) return null;

  const docLabel =
    trustIdentityDocType === 'PASSPORT' ? tb.passport : tb.nationalId;

  return (
    <div className="rounded-2xl border border-slate-100 p-4">
      <p className="mb-3 text-sm font-bold text-slate-500">{m.admin.verificationDocuments}</p>
      {hasStatus ? (
        <p className="mb-3 text-sm text-slate-700">
          <span className="font-bold">{m.admin.trustBadgeStatus}: </span>
          {statusLabel(trustBadgeStatus!, m.admin)}
        </p>
      ) : null}
      {trustBadgeStatus === 'REJECTED' && trustBadgeRejectionReason ? (
        <p className="mb-3 text-sm text-red-700">
          <span className="font-bold">{m.admin.rejectionReason}: </span>
          {trustBadgeRejectionReason}
        </p>
      ) : null}
      {hasDocs ? (
        <div className="flex flex-wrap gap-2">
          <DocLink href={trustIdentityDocUrl} label={docLabel} />
        </div>
      ) : (
        <p className="text-sm text-slate-400">—</p>
      )}
    </div>
  );
}

type StoreTrustDocsProps = {
  trustBadgeStatus?: string;
  trustBadgeRejectionReason?: string | null;
  trustCommercialRegDocUrl?: string | null;
  trustOcciDocUrl?: string | null;
  trustSmeDocUrl?: string | null;
  trustOtherDocUrl?: string | null;
  trustOtherDocLabel?: string | null;
};

export function AdminStoreVerificationDocs({
  trustBadgeStatus,
  trustBadgeRejectionReason,
  trustCommercialRegDocUrl,
  trustOcciDocUrl,
  trustSmeDocUrl,
  trustOtherDocUrl,
  trustOtherDocLabel
}: StoreTrustDocsProps) {
  const { m } = useI18n();
  const tb = m.trustBadge;

  const items = [
    { href: trustCommercialRegDocUrl, label: tb.commercialRegistration },
    { href: trustOcciDocUrl, label: tb.occiCertificate },
    { href: trustSmeDocUrl, label: tb.smeCard },
    {
      href: trustOtherDocUrl,
      label: trustOtherDocLabel || tb.otherDocument
    }
  ].filter((item) => item.href);

  const hasStatus = trustBadgeStatus && trustBadgeStatus !== 'NONE';

  if (!items.length && !hasStatus) return null;

  return (
    <div className="rounded-2xl border border-slate-100 p-4">
      <p className="mb-3 text-sm font-bold text-slate-500">{m.admin.verificationDocuments}</p>
      {hasStatus ? (
        <p className="mb-3 text-sm text-slate-700">
          <span className="font-bold">{m.admin.trustBadgeStatus}: </span>
          {statusLabel(trustBadgeStatus!, m.admin)}
        </p>
      ) : null}
      {trustBadgeStatus === 'REJECTED' && trustBadgeRejectionReason ? (
        <p className="mb-3 text-sm text-red-700">
          <span className="font-bold">{m.admin.rejectionReason}: </span>
          {trustBadgeRejectionReason}
        </p>
      ) : null}
      {items.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <DocLink key={item.href} href={item.href} label={item.label} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-400">—</p>
      )}
    </div>
  );
}

function statusLabel(
  status: string,
  labels: {
    trustBadgePending: string;
    trustBadgeApproved: string;
    trustBadgeRejected: string;
    trustBadgeNone: string;
  }
) {
  switch (status) {
    case 'PENDING':
      return labels.trustBadgePending;
    case 'APPROVED':
      return labels.trustBadgeApproved;
    case 'REJECTED':
      return labels.trustBadgeRejected;
    default:
      return labels.trustBadgeNone;
  }
}
