import { redis } from '../../config/redis';

const pendingKey = (email: string) => `reg:pending:${email.toLowerCase()}`;
const resendKey = (type: 'email' | 'phone', identifier: string) =>
  `reg:resend:${type}:${identifier.toLowerCase()}`;

const PENDING_TTL_SECONDS = 30 * 60;
export const RESEND_COOLDOWN_SECONDS = 60;

export type PendingRegistration = {
  fullName: string;
  email: string;
  phone?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
};

export async function getPendingRegistration(email: string): Promise<PendingRegistration | null> {
  const raw = await redis.get(pendingKey(email));
  if (!raw) return null;
  return JSON.parse(raw) as PendingRegistration;
}

export async function savePendingRegistration(email: string, data: PendingRegistration) {
  await redis.set(pendingKey(email), JSON.stringify(data), 'EX', PENDING_TTL_SECONDS);
}

export async function clearPendingRegistration(email: string) {
  await redis.del(pendingKey(email));
}

export async function getResendCooldownRemaining(type: 'email' | 'phone', identifier: string): Promise<number> {
  const ttl = await redis.ttl(resendKey(type, identifier));
  return ttl > 0 ? ttl : 0;
}

export async function setResendCooldown(type: 'email' | 'phone', identifier: string) {
  await redis.set(resendKey(type, identifier), '1', 'EX', RESEND_COOLDOWN_SECONDS);
}
