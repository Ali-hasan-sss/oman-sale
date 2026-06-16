import { redis } from '../../config/redis';

const verifiedKey = (userId: string) => `user:phone:verified:${userId}`;
const VERIFIED_TTL_SECONDS = 30 * 60;

export async function setUserVerifiedPhone(userId: string, phone: string) {
  await redis.set(verifiedKey(userId), phone, 'EX', VERIFIED_TTL_SECONDS);
}

export async function getUserVerifiedPhone(userId: string) {
  return redis.get(verifiedKey(userId));
}

export async function clearUserVerifiedPhone(userId: string) {
  await redis.del(verifiedKey(userId));
}

export function normalizePhone(value: string) {
  return value.replace(/[\s()-]/g, '');
}
