'use client';

import { Globe, MessageCircle, Store } from 'lucide-react';

import { HeaderCustomNavButtons } from '@/components/navigation/header-custom-nav-buttons';
import { getHeaderButtonLabel, type HeaderNavButtonRecord } from '@/lib/header-nav';
import { useI18n } from '@/lib/i18n';

type HeaderNavButtonsPreviewProps = {
  buttons: HeaderNavButtonRecord[];
};

export function HeaderNavButtonsPreview({ buttons }: HeaderNavButtonsPreviewProps) {
  const { locale, m } = useI18n();
  const outline =
    'whitespace-nowrap rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 sm:px-2.5 sm:py-2 lg:px-4 lg:text-sm';
  const primary =
    'whitespace-nowrap rounded-lg bg-green-600 px-2 py-1.5 text-xs font-bold text-white sm:px-2.5 sm:py-2 lg:px-4 lg:text-sm';
  const fixed =
    'whitespace-nowrap rounded-lg border border-dashed border-slate-300 bg-slate-50 px-2 py-1.5 text-xs font-medium text-slate-500 sm:px-2.5 sm:py-2 lg:px-4 lg:text-sm';

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
        <div className="flex min-w-max items-center justify-end gap-1.5 lg:gap-2">
          <span className={`inline-flex items-center gap-1.5 ${fixed}`}>
            <Globe size={14} />
            {m.common.languageSwitch}
          </span>
          <span className={`inline-flex items-center gap-1.5 ${fixed}`}>
            <MessageCircle size={14} />
            {m.common.chats}
          </span>
          <span className={fixed}>{m.common.browseStores}</span>
          <HeaderCustomNavButtons
            previewButtons={previewButtons}
            className="flex items-center gap-1.5 lg:gap-2"
            linkClassName={outline}
          />
          <span className={fixed}>{m.common.allListings}</span>
          <span className={fixed}>{m.common.myListings}</span>
          <span className={`inline-flex items-center gap-1.5 ${fixed}`}>
            <Store size={14} />
            {m.common.createStore}
          </span>
          <span className={primary}>{m.common.addListing}</span>
          <span className={fixed}>{m.common.login}</span>
        </div>
      </div>
    </div>
  );
}
