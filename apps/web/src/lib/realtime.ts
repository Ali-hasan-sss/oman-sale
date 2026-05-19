'use client';

import { io, type Socket } from 'socket.io-client';

import { getSocketBaseUrl } from '@/lib/api-base-url';
import { getUserAccessToken } from '@/lib/user-auth';

let socket: Socket | undefined;

export const getRealtimeSocket = () => {
  const token = getUserAccessToken();
  if (!token) return undefined;

  if (!socket) {
    socket = io(getSocketBaseUrl(), {
      auth: { token },
      autoConnect: false,
      transports: ['websocket', 'polling']
    });
  } else {
    socket.auth = { token };
  }

  if (!socket.connected) socket.connect();
  return socket;
};

export const disconnectRealtimeSocket = () => {
  socket?.disconnect();
  socket = undefined;
};
