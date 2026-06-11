'use client';

import { ChevronDown, Globe } from 'lucide-react';

import { HeaderCustomNavButtons } from '@/components/navigation/header-custom-nav-buttons';
import { getHeaderButtonLabel, type HeaderNavButtonRecord } from '@/lib/header-nav';
import { useI18n } from '@/lib/i18n';

type HeaderNavButtonsPreviewProps = {
  buttons: HeaderNavButtonRecord[];
};

export function HeaderNavButtonsPreview({ buttons }: HeaderNavButtonsPreviewProps) {
  const { dir, locale, m } = useI18n();
  const primary =
    'whitespace-nowrap rounded-lg bg-green-600 px-2 py-1.5 text-xs font-bold text-white sm:px-2.5 sm:py-2 lg:px-4 lg:text-sm';
  const fixed =
    'whitespace-nowrap rounded-lg border border-dashed border-slate-300 bg-slate-50 px-2 py-1.5 text-xs font-medium text-slate-500 sm:px-2.5 sm:py-2 lg:px-4 lg:text-sm';
  const customLink =
    'whitespace-nowrap rounded-lg border-2 border-brand-400 bg-brand-50 px-2 py-1.5 text-xs font-bold text-brand-800 sm:px-2.5 sm:py-2 lg:px-4 lg:text-sm';

  const previewButtons = buttons
    .filter((button) => button.isActive)
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((button) => ({
      id: button.id,
      sortOrder: button.sortOrder,
      label: getHeaderButtonLabel(button, locale),
      linkUrl: button.linkUrl
    }));

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-100 p-4">
      <p className="mb-3 text-sm font-bold text-slate-700">{m.admin.headerButtonsPreview}</p>
      <p className="mb-4 text-xs text-slate-500">{m.admin.headerButtonsPreviewHint}</p>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
        <div className="flex min-w-max items-center justify-end gap-1.5 lg:gap-2" dir={dir}>
          <span className={`inline-flex items-center gap-1.5 ${fixed}`}>
            <Globe size={14} className="shrink-0" />
            {m.common.languageSwitch}
          </span>

          <span className="inline-flex max-w-full items-stretch overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50">
            <span className="truncate px-2 py-1.5 text-xs font-medium text-slate-500 sm:px-2.5 sm:py-2 lg:px-4 lg:text-sm">
              {m.common.browseStores}
            </span>
            <span className="inline-flex shrink-0 items-center border-s border-dashed border-slate-300 px-1.5 py-1.5 text-slate-500 sm:px-2 sm:py-2">
              <ChevronDown size={16} />
            </span>
          </span>

          {previewButtons.length > 0 ? (
            <HeaderCustomNavButtons
              previewButtons={previewButtons}
              className="flex items-center gap-1.5 lg:gap-2"
              linkClassName={customLink}
            />
          ) : (
            <span className={`${customLink} opacity-60`}>{m.admin.headerButtonsPreviewCustomPlaceholder}</span>
          )}

          <span className={fixed}>{m.common.news}</span>
          <span className={fixed}>{m.common.pricing}</span>
          <span className={fixed}>{m.common.allListings}</span>
          <span className={primary}>{m.common.addListing}</span>
          <span className={fixed}>{m.common.login}</span>
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-500">{m.admin.headerButtonsPreviewUserMenuHint}</p>
    </div>
  );
}
