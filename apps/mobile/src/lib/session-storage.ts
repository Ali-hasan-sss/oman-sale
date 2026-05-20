import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AuthSession, User } from '../types';

export const accessTokenKey = 'oman_sale_user_access_token';
export const refreshTokenKey = 'oman_sale_user_refresh_token';
export const userKey = 'oman_sale_user';

export async function loadStoredSession() {
  const pairs = await AsyncStorage.multiGet([accessTokenKey, refreshTokenKey, userKey]);
  const tokenMap = Object.fromEntries(pairs);
  const user = tokenMap[userKey] ? (JSON.parse(tokenMap[userKey]) as User) : undefined;

  return {
    accessToken: tokenMap[accessTokenKey] ?? undefined,
    refreshToken: tokenMap[refreshTokenKey] ?? undefined,
    user
  };
}

export async function persistSession(session: AuthSession) {
  await AsyncStorage.multiSet([
    [accessTokenKey, session.tokens.accessToken],
    [refreshTokenKey, session.tokens.refreshToken],
    [userKey, JSON.stringify(session.user)]
  ]);
}

export async function persistTokens(tokens: { accessToken: string; refreshToken: string }) {
  await AsyncStorage.multiSet([
    [accessTokenKey, tokens.accessToken],
    [refreshTokenKey, tokens.refreshToken]
  ]);
}

export async function clearStoredSession() {
  await AsyncStorage.multiRemove([accessTokenKey, refreshTokenKey, userKey]);
}
