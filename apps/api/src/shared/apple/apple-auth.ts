import { createPublicKey, type KeyObject } from 'node:crypto';

import jwt from 'jsonwebtoken';

import { env } from '../../config/env';
import { ApiError } from '../utils/api-error';

const APPLE_ISSUER = 'https://appleid.apple.com';
const APPLE_JWKS_URL = 'https://appleid.apple.com/auth/keys';
const JWKS_TTL_MS = 60 * 60 * 1000;

type AppleJwk = {
  kid: string;
  kty: string;
  use?: string;
  alg?: string;
  n: string;
  e: string;
};

type AppleJwks = { keys: AppleJwk[] };

type AppleJwtPayload = {
  sub?: string;
  email?: string;
  email_verified?: boolean | string;
  iss?: string;
  aud?: string | string[];
};

let cachedJwks: { fetchedAt: number; keys: AppleJwk[] } | null = null;

export type VerifiedAppleToken = {
  appleId: string;
  email?: string;
  emailVerified: boolean;
};

function allowedAppleAudiences(): string[] {
  const audiences = new Set(['com.omansale.mobile']);
  const configured = env.APPLE_CLIENT_ID?.trim();
  if (configured) audiences.add(configured);
  return [...audiences];
}

async function fetchAppleJwks(): Promise<AppleJwk[]> {
  if (cachedJwks && Date.now() - cachedJwks.fetchedAt < JWKS_TTL_MS) {
    return cachedJwks.keys;
  }

  const response = await fetch(APPLE_JWKS_URL, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new ApiError(503, 'Apple sign-in is temporarily unavailable');

  const body = (await response.json()) as AppleJwks;
  if (!Array.isArray(body.keys) || body.keys.length === 0) {
    throw new ApiError(503, 'Apple sign-in is temporarily unavailable');
  }

  cachedJwks = { fetchedAt: Date.now(), keys: body.keys };
  return body.keys;
}

function jwkToPublicKey(jwk: AppleJwk): KeyObject {
  return createPublicKey({
    key: { kty: jwk.kty, n: jwk.n, e: jwk.e },
    format: 'jwk'
  });
}

export async function verifyAppleIdentityToken(identityToken: string): Promise<VerifiedAppleToken> {
  const decoded = jwt.decode(identityToken, { complete: true });
  if (!decoded || typeof decoded === 'string' || !decoded.header.kid) {
    throw new ApiError(401, 'Invalid Apple token');
  }

  const keys = await fetchAppleJwks();
  const jwk = keys.find((key) => key.kid === decoded.header.kid);
  if (!jwk) throw new ApiError(401, 'Invalid Apple token');

  let payload: AppleJwtPayload;
  try {
    payload = jwt.verify(identityToken, jwkToPublicKey(jwk), {
      algorithms: ['RS256'],
      issuer: APPLE_ISSUER,
      clockTolerance: 120
    }) as AppleJwtPayload;
  } catch {
    throw new ApiError(401, 'Invalid Apple token');
  }

  const tokenAudiences = (Array.isArray(payload.aud) ? payload.aud : [payload.aud]).filter(
    (value): value is string => typeof value === 'string' && value.length > 0
  );
  const allowed = allowedAppleAudiences();
  if (!tokenAudiences.some((audience) => allowed.includes(audience))) {
    throw new ApiError(401, 'Invalid Apple token');
  }

  const appleId = payload.sub?.trim();
  if (!appleId) throw new ApiError(401, 'Invalid Apple token');

  const email = payload.email?.trim().toLowerCase();
  const emailVerified =
    payload.email_verified === true || payload.email_verified === 'true' || Boolean(email);

  return { appleId, email, emailVerified };
}
