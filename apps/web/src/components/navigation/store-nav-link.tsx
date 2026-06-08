'use client';

import { Store } from 'lucide-react';
import Link from 'next/link';

import { useOwnerStore } from '@/hooks/use-owner-store';
import { useI18n } from '@/lib/i18n';

type StoreNavLinkProps = {
  className?: string;
  onNavigate?: () => void;
  showIcon?: boolean;
};

export function StoreNavLink({ className, onNavigate, showIcon = false }: StoreNavLinkProps) {
  const { localizedPath, m } = useI18n();
  const { hasStore } = useOwnerStore();

  return (
    <Link
      href={localizedPath(hasStore ? '/my-store' : '/stores/create')}
      className={showIcon ? `inline-flex items-center gap-1.5 ${className ?? ''}` : className}
      onClick={onNavigate}
    >
      {showIcon ? (
        <>
          <Store size={14} className="shrink-0 lg:hidden" />
          <Store size={16} className="hidden shrink-0 lg:block" />
        </>
      ) : null}
      <span>{hasStore ? m.common.myStore : m.common.createStore}</span>
    </Link>
  );
}
