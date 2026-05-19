import jwt, { type SignOptions } from 'jsonwebtoken';

import { env } from '../../config/env';

type TokenPayload = {
  userId: string;
  email: string;
  role: string;
};

export type RefreshTokenPayload = {
  sub: string;
  email: string;
  role: string;
};

export const signAccessToken = ({ userId, email, role }: TokenPayload) =>
  jwt.sign({ email, role }, env.JWT_ACCESS_SECRET, {
    subject: userId,
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn']
  });

export const signRefreshToken = ({ userId, email, role }: TokenPayload) =>
  jwt.sign({ email, role }, env.JWT_REFRESH_SECRET, {
    subject: userId,
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn']
  });

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
