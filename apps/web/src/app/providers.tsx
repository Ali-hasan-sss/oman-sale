'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type PropsWithChildren } from 'react';

import { UserSessionBootstrap } from '@/components/auth/user-session-bootstrap';
import { ProfileCompletionGuard } from '@/components/auth/profile-completion-guard';
import { DeploymentRecovery } from '@/components/navigation/deployment-recovery';
import { RouteProgressBar } from '@/components/navigation/route-progress-bar';
import { AssistantChatWidget } from '@/components/assistant/assistant-chat-widget';
import { MediaConfigBootstrap } from '@/components/media/media-config-bootstrap';
import { I18nProvider } from '@/lib/i18n';

export function Providers({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <I18nProvider>
      <DeploymentRecovery />
      <QueryClientProvider client={queryClient}>
        <MediaConfigBootstrap />
        <UserSessionBootstrap />
        <ProfileCompletionGuard />
        <RouteProgressBar />
        {children}
        <AssistantChatWidget />
      </QueryClientProvider>
    </I18nProvider>
  );
}
