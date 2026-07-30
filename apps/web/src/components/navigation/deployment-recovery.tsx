'use client';

import { useEffect } from 'react';

const RELOAD_KEY = 'oman_sale_chunk_reload';

function isChunkLoadError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const name = 'name' in error ? String(error.name) : '';
  const message = 'message' in error ? String(error.message) : '';

  return (
    name === 'ChunkLoadError' ||
    message.includes('Loading chunk') ||
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('error loading dynamically imported module')
  );
}

function reloadOnceForStaleDeployment() {
  try {
    if (sessionStorage.getItem(RELOAD_KEY) === '1') return;
    sessionStorage.setItem(RELOAD_KEY, '1');
  } catch {
    // sessionStorage may be unavailable; still attempt a single recovery reload.
  }

  window.location.reload();
}

/**
 * After a new deploy, open tabs may request old `/_next/static/chunks/*` hashes.
 * That causes ChunkLoadError → hydration failure → blank page. One hard reload
 * picks up the current build assets.
 */
export function DeploymentRecovery() {
  useEffect(() => {
    try {
      sessionStorage.removeItem(RELOAD_KEY);
    } catch {
      // ignore
    }

    const onError = (event: ErrorEvent) => {
      if (isChunkLoadError(event.error) || isChunkLoadError(event.message)) {
        reloadOnceForStaleDeployment();
      }
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (isChunkLoadError(event.reason)) {
        reloadOnceForStaleDeployment();
      }
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, []);

  return null;
}
