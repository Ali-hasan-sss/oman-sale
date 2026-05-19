export const USER_ACCESS_TOKEN_KEY = 'oman_sale_user_access_token';
export const USER_REFRESH_TOKEN_KEY = 'oman_sale_user_refresh_token';
export const USER_KEY = 'oman_sale_user';

export type UserAuthUser = {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  role: string;
  avatar?: string | null;
  bio?: string | null;
  isVerified?: boolean;
  isActive?: boolean;
  isBlocked?: boolean;
  lastSeenAt?: string | null;
  createdAt?: string;
};

export type UserAuthSession = {
  user: UserAuthUser;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
};

export const getStoredUser = () => {
  if (typeof window === 'undefined') return undefined;

  const rawUser = window.localStorage.getItem(USER_KEY);
  if (!rawUser) return undefined;

  try {
    return JSON.parse(rawUser) as UserAuthUser;
  } catch {
    return undefined;
  }
};

export const getUserAccessToken = () => {
  if (typeof window === 'undefined') return undefined;
  return window.localStorage.getItem(USER_ACCESS_TOKEN_KEY) ?? undefined;
};

export const getUserRefreshToken = () => {
  if (typeof window === 'undefined') return undefined;
  return window.localStorage.getItem(USER_REFRESH_TOKEN_KEY) ?? undefined;
};

export const saveUserTokens = (tokens: UserAuthSession['tokens']) => {
  window.localStorage.setItem(USER_ACCESS_TOKEN_KEY, tokens.accessToken);
  window.localStorage.setItem(USER_REFRESH_TOKEN_KEY, tokens.refreshToken);
};

export const saveUserSession = (session: UserAuthSession) => {
  saveUserTokens(session.tokens);
  window.localStorage.setItem(USER_KEY, JSON.stringify(session.user));
};

export const saveUser = (user: UserAuthUser) => {
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearUserSession = () => {
  window.localStorage.removeItem(USER_ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(USER_REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
};
