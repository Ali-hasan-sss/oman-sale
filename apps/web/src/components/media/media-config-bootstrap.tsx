'use client';

import { useEffect } from 'react';

import { getApiBaseUrl } from '@/lib/api-base-url';
import { api } from '@/lib/api';
import { setMediaBaseUrl } from '@/lib/media-url';

export function MediaConfigBootstrap() {
  useEffect(() => {
    let active = true;

    api
      .get<{ data: { publicBaseUrl: string | null; access?: 'private' | 'public' | 'local' } }>('/media/config')
      .then((response) => {
        if (!active) return;

        const { publicBaseUrl, access } = response.data.data;
        if (access === 'private' || access === 'local') {
          setMediaBaseUrl(`${getApiBaseUrl()}/media/files`);
          return;
        }

        setMediaBaseUrl(publicBaseUrl);
      })
      .catch(() => {
        setMediaBaseUrl(`${getApiBaseUrl()}/media/files`);
      });

    return () => {
      active = false;
    };
  }, []);

  return null;
}
