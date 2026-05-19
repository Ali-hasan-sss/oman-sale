import type { Request } from 'express';
import { ViewSource } from '@prisma/client';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ViewerContext = {
  visitorKey: string;
  ipAddress: string;
  source: ViewSource;
  userAgent?: string;
  userId?: string;
};

export const getClientIp = (req: Request) => {
  return req.ip || req.socket.remoteAddress || 'unknown';
};

const parseViewSource = (value: string | undefined): ViewSource => {
  if (value?.toLowerCase() === 'mobile') return ViewSource.MOBILE;
  return ViewSource.WEB;
};

const readDeviceId = (req: Request) => {
  const raw = req.headers['x-device-id'] ?? req.headers['x-viewer-id'];
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value === 'string' && UUID_RE.test(value.trim())) return value.trim();
  return undefined;
};

export const buildVisitorKey = (userId: string | undefined, deviceId: string | undefined, ip: string, userAgent?: string) => {
  if (userId) return `user:${userId}`;
  if (deviceId) return `device:${deviceId}`;
  const ua = (userAgent ?? 'unknown').slice(0, 120);
  return `fallback:${ip}:${ua}`;
};

export const getViewerContext = (req: Request): ViewerContext => {
  const ipAddress = getClientIp(req);
  const userAgent = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined;
  const sourceHeader = req.headers['x-client-source'];
  const sourceValue = Array.isArray(sourceHeader) ? sourceHeader[0] : sourceHeader;
  const deviceId = readDeviceId(req);
  const userId = req.user?.id;

  return {
    visitorKey: buildVisitorKey(userId, deviceId, ipAddress, userAgent),
    ipAddress,
    source: parseViewSource(typeof sourceValue === 'string' ? sourceValue : undefined),
    userAgent,
    userId
  };
};
