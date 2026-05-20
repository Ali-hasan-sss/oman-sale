import { isAxiosError } from 'axios';
import { create } from 'zustand';

import { setupApiInterceptors } from '../lib/api/interceptors';
import { setupApiLogging } from '../lib/api/logger';
import {
  clearStoredSession,
  loadStoredSession,
  persistSession,
  persistTokens
} from '../lib/session-storage';
import {
  EMAIL_VERIFICATION_REQUIRED,
  forgotPasswordRequest,
  getApiErrorMessage,
  loginRequest,
  refreshTokensRequest,
  registerRequest,
  resendVerificationRequest,
  resetPasswordRequest,
  verifyEmailRequest
} from '../services/auth.service';
import type { AuthSession, Locale, User } from '../types';

type AuthTokens = AuthSession['tokens'];

type AuthState = {
  accessToken?: string;
  refreshToken?: string;
  user?: User;
  isHydrated: boolean;
  isAuthenticating: boolean;
  authError?: string;
  hydrate: () => Promise<void>;
  setSession: (session: AuthSession) => Promise<void>;
  setTokens: (tokens: AuthTokens) => Promise<void>;
  clearSession: () => Promise<void>;
  logout: () => Promise<void>;
  login: (email: string, password: string) => Promise<
    | { ok: true }
    | { ok: false; needsVerification: true; email: string }
    | { ok: false; error: string }
  >;
  register: (payload: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    locale: Locale;
  }) => Promise<{ ok: true; email: string } | { ok: false; error: string }>;
  verifyEmail: (email: string, code: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  resendVerification: (email: string, locale: Locale) => Promise<{ ok: true } | { ok: false; error: string }>;
  forgotPassword: (email: string, locale: Locale) => Promise<{ ok: true } | { ok: false; error: string }>;
  resetPassword: (
    email: string,
    code: string,
    password: string
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  refreshAccessToken: () => Promise<AuthTokens>;
};

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
      return { ok: true };
    } catch (error) {
      if (isAxiosError<{ message?: string }>(error) && error.response?.data.message === EMAIL_VERIFICATION_REQUIRED) {
        return { ok: false, needsVerification: true, email };
      }
      const message = getApiErrorMessage(error, 'login');
      set({ authError: message });
      return { ok: false, error: message };
    } finally {
      set({ isAuthenticating: false });
    }
  },

  register: async (payload) => {
    set({ isAuthenticating: true, authError: undefined });
    try {
      const result = await registerRequest(payload);
      return { ok: true, email: result.email };
    } catch (error) {
      const message = getApiErrorMessage(error, 'register');
      set({ authError: message });
      return { ok: false, error: message };
    } finally {
      set({ isAuthenticating: false });
    }
  },

  verifyEmail: async (email, code) => {
    set({ isAuthenticating: true, authError: undefined });
    try {
      const session = await verifyEmailRequest(email, code);
      await get().setSession(session);
      return { ok: true };
    } catch (error) {
      const message = getApiErrorMessage(error, 'verify');
      set({ authError: message });
      return { ok: false, error: message };
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
      return { ok: false, error: message };
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
      return { ok: false, error: message };
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
      return { ok: false, error: message };
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
  }
}));

/** Wire HTTP interceptors to auth store (call once at app bootstrap). */
export function bindAuthStoreToApi() {
  setupApiInterceptors({
    getAccessToken: () => useAuthStore.getState().accessToken,
    refreshTokens: () => useAuthStore.getState().refreshAccessToken(),
    clearSession: () => useAuthStore.getState().clearSession()
  });
  setupApiLogging();
}
