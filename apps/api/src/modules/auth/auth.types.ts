import type { User } from '@prisma/client';

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthUserResponse = Pick<User, 'id' | 'fullName' | 'email' | 'phone' | 'role' | 'avatar'>;
