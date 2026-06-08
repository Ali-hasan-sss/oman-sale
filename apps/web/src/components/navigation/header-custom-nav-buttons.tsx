'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { api } from '@/lib/api';
import { resolveHeaderHref, type HeaderNavButtonPublic } from '@/lib/header-nav';
import { useI18n } from '@/lib/i18n';

type HeaderCustomNavButtonsProps = {
  variant?: 'default' | 'hero';
  className?: string;
  linkClassName?: string;
  onNavigate?: () => void;
  previewButtons?: HeaderNavButtonPublic[];
};

export function HeaderCustomNavButtons({
  variant = 'default',
  className,
  linkClassName,
  onNavigate,
  previewButtons
}: HeaderCustomNavButtonsProps) {
  const { locale, localizedPath } = useI18n();
  const [buttons, setButtons] = useState<HeaderNavButtonPublic[]>(previewButtons ?? []);
  const [loaded, setLoaded] = useState(Boolean(previewButtons));

  useEffect(() => {
    if (previewButtons) {
      setButtons(previewButtons.filter((button) => button.label));
      setLoaded(true);
      return;
    }

    let active = true;
    api
      .get<{ data: HeaderNavButtonPublic[] }>('/hero/header-buttons', { params: { locale } })
      .then((response) => {
        if (!active) return;
        setButtons(response.data.data);
      })
      .catch(() => {
        if (!active) return;
        setButtons([]);
      })
      .finally(() => {
        if (active) setLoaded(true);
      });

    return () => {
      active = false;
    };
  }, [locale, previewButtons]);

  if (!loaded || buttons.length === 0) return null;

  const defaultOutline =
    variant === 'hero'
      ? 'whitespace-nowrap rounded-lg border border-white/70 bg-white/90 px-2 py-1.5 text-xs font-medium shadow-lg transition hover:bg-white sm:px-2.5 sm:py-2 lg:px-4 lg:text-sm'
      : 'whitespace-nowrap rounded-lg border border-gray-300 px-2 py-1.5 text-xs font-medium transition hover:bg-gray-50 sm:px-2.5 sm:py-2 lg:px-4 lg:text-sm';

  return (
    <div className={className}>
      {buttons.map((button) => (
        <Link
          key={button.id}
          href={resolveHeaderHref(button.linkUrl, localizedPath)}
          className={linkClassName ?? defaultOutline}
          onClick={onNavigate}
        >
          {button.label}
        </Link>
      ))}
    </div>
  );
}
