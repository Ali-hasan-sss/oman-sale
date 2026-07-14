const THAWANI_PENDING_SESSION_KEY = 'thawani_pending_session';

export function storePendingThawaniSession(sessionId: string) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(THAWANI_PENDING_SESSION_KEY, sessionId);
}

export function resolvePendingThawaniSession(searchSessionId: string | null) {
  if (typeof window === 'undefined') return searchSessionId;

  const storedSessionId = sessionStorage.getItem(THAWANI_PENDING_SESSION_KEY);
  const sessionId = searchSessionId || storedSessionId;
  if (sessionId && storedSessionId) {
    sessionStorage.removeItem(THAWANI_PENDING_SESSION_KEY);
  }

  return sessionId;
}
