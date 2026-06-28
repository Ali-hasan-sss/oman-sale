import { create } from 'zustand';

import { setupApiInterceptors } from '../lib/api/interceptors';
import { setupApiLogging } from '../lib/api/logger';
import { signInWithGoogleNative } from '../lib/google-auth';
import {
  clearStoredSession,
  loadStoredSession,
  persistSession,
  persistTokens
} from '../lib/session-storage';
import { getApiErrorCode } from '../lib/api-errors';
import {
  completeProfileRequest,
  completeProfileSendPhoneRequest,
  completeProfileVerifyPhoneRequest,
  forgotPasswordRequest,
  getApiErrorMessage,
  googleAuthRequest,
  isEmailVerificationRequiredError,
  loginRequest,
  refreshTokensRequest,
  resendVerificationRequest,
  resetPasswordRequest,
  verifyEmailRequest,
  type PhoneVerificationChannel
} from '../services/auth.service';
import { fetchCurrentUser } from '../services/user.service';
import type { AuthSession, Locale, User } from '../types';

type AuthTokens = AuthSession['tokens'];

type AuthSuccess = { ok: true; profileCompleted: boolean };

type AuthState = {
  accessToken?: string;
  refreshToken?: string;
  user?: User;
  isHydrated: boolean;
  isAuthenticating: boolean;
  authError?: string;
  hydrate: () => Promise<void>;
  setSession: (session: AuthSession) => Promise<void>;
  setUser: (user: User) => Promise<void>;
  setTokens: (tokens: AuthTokens) => Promise<void>;
  clearSession: () => Promise<void>;
  logout: () => Promise<void>;
  login: (email: string, password: string) => Promise<
    | AuthSuccess
    | { ok: false; needsVerification: true; email: string }
    | { ok: false; error: string; errorCode?: string }
  >;
  googleSignIn: () => Promise<AuthSuccess | { ok: false; error: string; errorCode?: string; cancelled?: boolean }>;
  verifyEmail: (email: string, code: string) => Promise<AuthSuccess | { ok: false; error: string; errorCode?: string }>;
  resendVerification: (email: string, locale: Locale) => Promise<{ ok: true } | { ok: false; error: string; errorCode?: string }>;
  forgotPassword: (email: string, locale: Locale) => Promise<{ ok: true } | { ok: false; error: string; errorCode?: string }>;
  resetPassword: (
    email: string,
    code: string,
    password: string
  ) => Promise<{ ok: true } | { ok: false; error: string; errorCode?: string }>;
  completeProfileSendPhone: (phone: string, locale: Locale, channel?: PhoneVerificationChannel) => Promise<{ ok: true } | { ok: false; error: string; errorCode?: string }>;
  completeProfileVerifyPhone: (phone: string, code: string) => Promise<{ ok: true } | { ok: false; error: string; errorCode?: string }>;
  completeProfile: (payload: { fullName: string; phone: string; password: string }) => Promise<AuthSuccess | { ok: false; error: string; errorCode?: string }>;
  refreshAccessToken: () => Promise<AuthTokens>;
  markAccountRestricted: (reason: 'blocked' | 'inactive') => Promise<void>;
};

function isProfileComplete(user?: User) {
  return user?.profileCompleted !== false;
}

async function refreshCurrentUser() {
  const { accessToken, refreshToken } = useAuthStore.getState();
  if (!accessToken || !refreshToken) return;

  try {
    const freshUser = await fetchCurrentUser();
    await useAuthStore.getState().setSession({
      user: freshUser,
      tokens: { accessToken, refreshToken }
    });
  } catch {
    // Keep cached session when profile refresh fails.
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: undefined,
  refreshToken: undefined,
  user: undefined,
  isHydrated: false,
  isAuthenticating: false,
  authError: undefined,

  hydrate: async () => {
    try {
      const session = await loadStoredSession();
      set({
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        user: session.user,
        isHydrated: true
      });

      if (session.accessToken && session.refreshToken) {
        await refreshCurrentUser();
      }
    } catch {
      set({ isHydrated: true });
    }
  },

  setSession: async (session) => {
    await persistSession(session);
    set({
      accessToken: session.tokens.accessToken,
      refreshToken: session.tokens.refreshToken,
      user: session.user,
      authError: undefined
    });
  },

  setUser: async (user) => {
    const { accessToken, refreshToken } = get();
    if (!accessToken || !refreshToken) return;
    await persistSession({ user, tokens: { accessToken, refreshToken } });
    set({ user });
  },

  setTokens: async (tokens) => {
    await persistTokens(tokens);
    set({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
  },

  clearSession: async () => {
    await clearStoredSession();
    set({ accessToken: undefined, refreshToken: undefined, user: undefined, authError: undefined });
  },

  logout: async () => {
    await get().clearSession();
  },

  login: async (email, password) => {
    set({ isAuthenticating: true, authError: undefined });
    try {
      const session = await loginRequest(email, password);
      await get().setSession(session);
      await refreshCurrentUser();
      return { ok: true, profileCompleted: isProfileComplete(get().user) };
    } catch (error) {
      if (isEmailVerificationRequiredError(error)) {
        return { ok: false, needsVerification: true, email };
      }
      const message = getApiErrorMessage(error, 'login');
      const errorCode = getApiErrorCode(error);
      set({ authError: message });
      return { ok: false, error: message, errorCode };
    } finally {
      set({ isAuthenticating: false });
    }
  },

  googleSignIn: async () => {
    set({ isAuthenticating: true, authError: undefined });
    try {
      const idToken = await signInWithGoogleNative();
      const session = await googleAuthRequest(idToken);
      await get().setSession(session);
      await refreshCurrentUser();
      return { ok: true, profileCompleted: isProfileComplete(get().user) };
    } catch (error) {
      if (error instanceof Error && error.message === 'GOOGLE_SIGN_IN_CANCELLED') {
        return { ok: false, error: 'cancelled', cancelled: true };
      }
      if (
        error instanceof Error &&
        (error.message === 'FIREBASE_NOT_CONFIGURED' || error.message === 'GOOGLE_NATIVE_UNAVAILABLE')
      ) {
        return { ok: false, error: 'FIREBASE_NOT_CONFIGURED', errorCode: 'FIREBASE_NOT_CONFIGURED' };
      }
      const message = getApiErrorMessage(error, 'google');
      set({ authError: message });
      return { ok: false, error: message, errorCode: getApiErrorCode(error) };
    } finally {
      set({ isAuthenticating: false });
    }
  },

  verifyEmail: async (email, code) => {
    set({ isAuthenticating: true, authError: undefined });
    try {
      const session = await verifyEmailRequest(email, code);
      await get().setSession(session);
      await refreshCurrentUser();
      return { ok: true, profileCompleted: isProfileComplete(get().user) };
    } catch (error) {
      const message = getApiErrorMessage(error, 'verify');
      set({ authError: message });
      return { ok: false, error: message, errorCode: getApiErrorCode(error) };
    } finally {
      set({ isAuthenticating: false });
    }
  },

  resendVerification: async (email, locale) => {
    set({ isAuthenticating: true, authError: undefined });
    try {
      await resendVerificationRequest(email, locale);
      return { ok: true };
    } catch (error) {
      const message = getApiErrorMessage(error, 'resend');
      set({ authError: message });
      return { ok: false, error: message, errorCode: getApiErrorCode(error) };
    } finally {
      set({ isAuthenticating: false });
    }
  },

  forgotPassword: async (email, locale) => {
    set({ isAuthenticating: true, authError: undefined });
    try {
      await forgotPasswordRequest(email, locale);
      return { ok: true };
    } catch (error) {
      const message = getApiErrorMessage(error, 'reset');
      set({ authError: message });
      return { ok: false, error: message, errorCode: getApiErrorCode(error) };
    } finally {
      set({ isAuthenticating: false });
    }
  },

  resetPassword: async (email, code, password) => {
    set({ isAuthenticating: true, authError: undefined });
    try {
      await resetPasswordRequest(email, code, password);
      return { ok: true };
    } catch (error) {
      const message = getApiErrorMessage(error, 'reset');
      set({ authError: message });
      return { ok: false, error: message, errorCode: getApiErrorCode(error) };
    } finally {
      set({ isAuthenticating: false });
    }
  },

  completeProfileSendPhone: async (phone, locale, channel = 'whatsapp') => {
    set({ isAuthenticating: true, authError: undefined });
    try {
      await completeProfileSendPhoneRequest({ phone, locale, channel });
      return { ok: true };
    } catch (error) {
      const message = getApiErrorMessage(error, 'completeProfile');
      set({ authError: message });
      return { ok: false, error: message, errorCode: getApiErrorCode(error) };
    } finally {
      set({ isAuthenticating: false });
    }
  },

  completeProfileVerifyPhone: async (phone, code) => {
    set({ isAuthenticating: true, authError: undefined });
    try {
      await completeProfileVerifyPhoneRequest(phone, code);
      return { ok: true };
    } catch (error) {
      const message = getApiErrorMessage(error, 'verify');
      set({ authError: message });
      return { ok: false, error: message, errorCode: getApiErrorCode(error) };
    } finally {
      set({ isAuthenticating: false });
    }
  },

  completeProfile: async (payload) => {
    set({ isAuthenticating: true, authError: undefined });
    try {
      const user = await completeProfileRequest(payload);
      await get().setUser(user);
      return { ok: true, profileCompleted: true };
    } catch (error) {
      const message = getApiErrorMessage(error, 'completeProfile');
      set({ authError: message });
      return { ok: false, error: message, errorCode: getApiErrorCode(error) };
    } finally {
      set({ isAuthenticating: false });
    }
  },

  refreshAccessToken: async () => {
    const refreshToken = get().refreshToken ?? (await loadStoredSession()).refreshToken;
    if (!refreshToken) throw new Error('Missing refresh token');
    const tokens = await refreshTokensRequest(refreshToken);
    await get().setTokens(tokens);
    return tokens;
  },

  markAccountRestricted: async (reason) => {
    const { user, accessToken, refreshToken } = get();
    if (!user || !accessToken || !refreshToken) return;

    const updated: User = {
      ...user,
      ...(reason === 'blocked'
        ? { isBlocked: true, isActive: false }
        : { isActive: false })
    };

    await persistSession({
      user: updated,
      tokens: { accessToken, refreshToken }
    });
    set({ user: updated });
  }
}));

/** Wire HTTP interceptors to auth store (call once at app bootstrap). */
export function bindAuthStoreToApi() {
  setupApiInterceptors({
    getAccessToken: () => useAuthStore.getState().accessToken,
    refreshTokens: () => useAuthStore.getState().refreshAccessToken(),
    clearSession: () => useAuthStore.getState().clearSession(),
    markAccountRestricted: (reason) => useAuthStore.getState().markAccountRestricted(reason)
  });
  setupApiLogging();
}
