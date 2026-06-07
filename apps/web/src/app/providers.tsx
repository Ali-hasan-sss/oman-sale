'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type PropsWithChildren } from 'react';

import { RouteProgressBar } from '@/components/navigation/route-progress-bar';
import { AssistantChatWidget } from '@/components/assistant/assistant-chat-widget';
import { I18nProvider } from '@/lib/i18n';

export function Providers({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <I18nProvider>
      <QueryClientProvider client={queryClient}>
        <RouteProgressBar />
        {children}
        <AssistantChatWidget />
      </QueryClientProvider>
    </I18nProvider>
  );
}
