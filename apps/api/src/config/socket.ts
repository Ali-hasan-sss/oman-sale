import { createAdapter } from '@socket.io/redis-adapter';
import jwt from 'jsonwebtoken';
import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';

import { resolveCorsOrigin } from './cors';
import { env } from './env';
import { redis, socketPubClient, socketSubClient } from './redis';

let io: Server | undefined;

type SocketUserPayload = {
  sub: string;
  email: string;
  role: string;
};

const userSocketsKey = (userId: string) => `online:user:${userId}:sockets`;
const socketPresenceKey = (userId: string, socketId: string) => `online:user:${userId}:socket:${socketId}`;
const presenceTtlSeconds = 35;

const isUserOnline = async (userId: string) => {
  const socketIds = await redis.smembers(userSocketsKey(userId));
  if (socketIds.length === 0) return false;

  const existing = await Promise.all(socketIds.map((socketId) => redis.exists(socketPresenceKey(userId, socketId))));
  const staleSocketIds = socketIds.filter((_, index) => existing[index] === 0);
  if (staleSocketIds.length > 0) await redis.srem(userSocketsKey(userId), ...staleSocketIds);

  return existing.some(Boolean);
};

const refreshSocketPresence = async (userId: string, socketId: string) => {
  await redis.sadd(userSocketsKey(userId), socketId);
  await redis.expire(userSocketsKey(userId), 24 * 60 * 60);
  await redis.set(socketPresenceKey(userId, socketId), '1', 'EX', presenceTtlSeconds);
};

const clearSocketPresence = async (userId: string, socketId: string) => {
  await redis.del(socketPresenceKey(userId, socketId));
  await redis.srem(userSocketsKey(userId), socketId);
};

export const createSocketServer = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: resolveCorsOrigin,
      credentials: true
    }
  });

  io.adapter(createAdapter(socketPubClient, socketSubClient));

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (typeof token !== 'string') return next(new Error('Authentication required'));

    try {
      const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as SocketUserPayload;
      socket.data.userId = payload.sub;
      socket.data.email = payload.email;
      socket.data.role = payload.role;
      return next();
    } catch {
      return next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.data.userId as string;
    socket.join(`user:${userId}`);

    const wasOnline = await isUserOnline(userId);
    await refreshSocketPresence(userId, socket.id);
    if (!wasOnline) io?.emit('presence:changed', { userId, online: true });
    const presenceInterval = setInterval(() => {
      refreshSocketPresence(userId, socket.id).catch(() => undefined);
    }, 15_000);

    socket.on('conversation:join', (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on('conversation:leave', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on('typing:started', ({ conversationId, userId }) => {
      socket.to(`conversation:${conversationId}`).emit('typing:started', { conversationId, userId });
    });

    socket.on('typing:stopped', ({ conversationId, userId }) => {
      socket.to(`conversation:${conversationId}`).emit('typing:stopped', { conversationId, userId });
    });

    socket.on('presence:get', async (userIds: string[], callback?: (statuses: Record<string, boolean>) => void) => {
      const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
      const values = await Promise.all(uniqueIds.map((id) => isUserOnline(id)));
      const statuses = uniqueIds.reduce<Record<string, boolean>>((acc, id, index) => {
        acc[id] = Boolean(values[index]);
        return acc;
      }, {});
      callback?.(statuses);
    });

    socket.on('disconnect', async () => {
      clearInterval(presenceInterval);
      await clearSocketPresence(userId, socket.id);
      const stillOnline = await isUserOnline(userId);
      if (!stillOnline) {
        io?.emit('presence:changed', { userId, online: false });
      }
    });
  });

  return io;
};

export const getSocketServer = () => io;
