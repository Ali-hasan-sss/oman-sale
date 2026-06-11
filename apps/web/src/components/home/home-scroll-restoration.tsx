'use client';

import type { ReactNode } from 'react';

import { useScrollRestoration } from '@/hooks/use-scroll-restoration';

export function HomeScrollRestoration({ children }: { children: ReactNode }) {
  useScrollRestoration(true);
  return children;
}
