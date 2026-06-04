'use client';

import { Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, type KeyboardEvent, type ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { MobileNavMenu } from '@/components/navigation/mobile-nav-menu';
import { UserSiteHeaderNav } from '@/components/navigation/user-site-header-nav';
import {
  buildHeaderSearchUrl,
  getHeaderSearchMode,
  getHeaderSearchPlaceholder
} from '@/lib/header-search';
import { useI18n } from '@/lib/i18n';

type UserSiteHeaderProps = {
  variant?: 'default' | 'hero';
  sticky?: boolean;
  children?: ReactNode;
};

export function UserSiteHeader({ variant = 'default', sticky = true, children }: UserSiteHeaderProps) {
  const { localizedPath } = useI18n();

  const headerClass =
    variant === 'hero'
      ? `${sticky ? 'relative z-20' : 'relative'} shrink-0`
      : `${sticky ? 'sticky top-0 z-50' : 'relative'} shrink-0 bg-white shadow-sm`;

  return (
    <header className={headerClass}>
      <div className="mx-auto max-w-7xl px-4 py-3 sm:py-4">
        <div className={`flex items-center justify-between gap-2 sm:gap-3 md:gap-4 ${children ? 'mb-3 sm:mb-4' : ''}`}>
          <Link href={localizedPath('/')} className="flex shrink-0 items-center gap-2 sm:gap-3">
            {variant === 'hero' ? (
              <>
                <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white/95 shadow-lg sm:h-16 sm:w-16">
                  <img src="/logo.png" alt="Oman Sale" className="h-full w-full object-contain p-1.5" />
                </span>
                <span className="hidden text-xl font-black text-white drop-shadow md:block md:text-2xl">Oman Sale</span>
              </>
            ) : (
              <img src="/logo.png" alt="Oman Sale" className="h-12 w-auto sm:h-14" />
            )}
          </Link>
          <MobileNavMenu variant={variant === 'hero' ? 'hero' : 'light'} />
          <UserSiteHeaderNav variant={variant} />
        </div>
        {children}
      </div>
    </header>
  );
}

type SiteHeaderSearchProps = {
  className?: string;
  variant?: 'default' | 'hero';
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
};

export function SiteHeaderSearch(props: SiteHeaderSearchProps) {
  return (
    <Suspense fallback={<SiteHeaderSearchFallback {...props} />}>
      <SiteHeaderSearchInner {...props} />
    </Suspense>
  );
}

function SiteHeaderSearchFallback({ className, variant = 'default' }: SiteHeaderSearchProps) {
  const { dir, m } = useI18n();
  return (
    <SiteHeaderSearchField
      className={className}
      dir={dir}
      placeholder={m.headerSearch.globalPlaceholder}
      value=""
      variant={variant}
      onChange={() => undefined}
      onSubmit={() => undefined}
    />
  );
}

function SiteHeaderSearchInner({
  className,
  variant = 'default',
  value: controlledValue,
  onChange: controlledOnChange,
  onSubmit: controlledOnSubmit
}: SiteHeaderSearchProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { dir, localizedPath, m } = useI18n();

  const mode = getHeaderSearchMode(pathname);
  const urlQuery = searchParams.get('q') ?? '';
  const isControlled = controlledValue !== undefined;
  const [localValue, setLocalValue] = useState(urlQuery);
  const value = isControlled ? controlledValue : localValue;

  useEffect(() => {
    if (!isControlled) {
      setLocalValue(urlQuery);
    }
  }, [urlQuery, isControlled]);

  const placeholder = getHeaderSearchPlaceholder(mode, {
    global: m.headerSearch.globalPlaceholder,
    listings: m.headerSearch.listingsPlaceholder,
    stores: m.headerSearch.storesPlaceholder
  });

  const submit = () => {
    const term = value.trim();
    if (controlledOnSubmit) {
      controlledOnSubmit(term);
      return;
    }
    router.push(buildHeaderSearchUrl(mode, term, localizedPath, pathname));
  };

  return (
    <SiteHeaderSearchField
      className={className}
      dir={dir}
      placeholder={placeholder}
      value={value}
      variant={variant}
      onChange={(nextValue) => {
        if (isControlled) {
          controlledOnChange?.(nextValue);
          return;
        }
        setLocalValue(nextValue);
      }}
      onSubmit={submit}
    />
  );
}

function SiteHeaderSearchField({
  className,
  dir,
  placeholder,
  value,
  variant,
  onChange,
  onSubmit
}: {
  className?: string;
  dir: 'rtl' | 'ltr';
  placeholder: string;
  value: string;
  variant: 'default' | 'hero';
  onChange: (value: string) => void;
  onSubmit: () => void;
}) {
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      onSubmit();
    }
  };

  const inputClass =
    variant === 'hero'
      ? `w-full rounded-xl border border-white/60 bg-white/95 py-3 text-sm shadow-lg outline-none backdrop-blur-sm transition focus:ring-2 focus:ring-brand-500 sm:py-4 sm:text-base ${
          dir === 'rtl' ? 'pl-4 pr-12' : 'pl-4 pr-12'
        }`
      : `w-full rounded-lg border border-gray-300 py-3 outline-none focus:ring-2 focus:ring-green-500 ${
          dir === 'rtl' ? 'pl-4 pr-12' : 'pl-12 pr-4'
        }`;

  const iconClass =
    variant === 'hero'
      ? `absolute top-1/2 -translate-y-1/2 text-slate-400 ${dir === 'rtl' ? 'right-4' : 'left-4'}`
      : `absolute top-1/2 -translate-y-1/2 text-gray-400 ${dir === 'rtl' ? 'right-3' : 'left-3'}`;

  return (
    <form
      className={`relative ${className ?? ''}`}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <Search className={iconClass} size={20} />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={inputClass}
      />
    </form>
  );
}
