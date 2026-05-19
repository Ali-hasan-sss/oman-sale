import { create } from 'zustand';

import { getStoredUser, getUserAccessToken, type UserAuthUser } from '@/lib/user-auth';

type AuthState = {
  accessToken?: string;
  user?: UserAuthUser;
  setAccessToken: (token?: string) => void;
  setSession: (session: { accessToken?: string; user?: UserAuthUser }) => void;
  clearSession: () => void;
  hydrateFromStorage: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: undefined,
  user: undefined,
  setAccessToken: (accessToken) => set({ accessToken }),
  setSession: ({ accessToken, user }) => set({ accessToken, user }),
  clearSession: () => set({ accessToken: undefined, user: undefined }),
  hydrateFromStorage: () => set({ accessToken: getUserAccessToken(), user: getStoredUser() })
}));
