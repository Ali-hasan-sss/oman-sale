import { notifyAuthChanged } from '@/components/auth/user-menu';
import { api } from '@/lib/api';
import { getUserAccessToken, saveUser, type UserAuthUser } from '@/lib/user-auth';
import { useAuthStore } from '@/store/auth-store';

export async function syncCurrentUser(accessToken?: string): Promise<UserAuthUser | null> {
  const token = accessToken ?? getUserAccessToken();
  if (!token) return null;

  try {
    const response = await api.get<{ data: UserAuthUser }>('/users/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const user = response.data.data;

    saveUser(user);
    useAuthStore.getState().setSession({ accessToken: token, user });
    notifyAuthChanged();

    return user;
  } catch {
    return null;
  }
}
