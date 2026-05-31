import { create } from 'zustand';

import { getStoredUser, getUserAccessToken, saveUser, type UserAuthUser } from '@/lib/user-auth';

type AuthState = {
  accessToken?: string;
  user?: UserAuthUser;
  setAccessToken: (token?: string) => void;
  setSession: (session: { accessToken?: string; user?: UserAuthUser }) => void;
  clearSession: () => void;
  hydrateFromStorage: () => void;
  markAccountRestricted: (reason: 'blocked' | 'inactive') => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: undefined,
  user: undefined,
  setAccessToken: (accessToken) => set({ accessToken }),
  setSession: ({ accessToken, user }) => set({ accessToken, user }),
  clearSession: () => set({ accessToken: undefined, user: undefined }),
  hydrateFromStorage: () => set({ accessToken: getUserAccessToken(), user: getStoredUser() }),
  markAccountRestricted: (reason) => {
    const user = get().user ?? getStoredUser();
    if (!user) return;

    const updated: UserAuthUser = {
      ...user,
      ...(reason === 'blocked'
        ? { isBlocked: true, isActive: false }
        : { isActive: false })
    };

    saveUser(updated);
    set({ user: updated });
  }
}));
