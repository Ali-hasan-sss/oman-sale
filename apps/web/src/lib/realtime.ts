'use client';

import { io, type Socket } from 'socket.io-client';

import { getSocketBaseUrl } from '@/lib/api-base-url';
import { getNotificationAccessToken } from '@/lib/notification-session';
import { getUserAccessToken } from '@/lib/user-auth';

let socket: Socket | undefined;
let notificationSocket: Socket | undefined;

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

export const getNotificationRealtimeSocket = () => {
  const token = getNotificationAccessToken();
  if (!token) return undefined;

  if (!notificationSocket) {
    notificationSocket = io(getSocketBaseUrl(), {
      auth: { token },
      autoConnect: false,
      transports: ['websocket', 'polling']
    });
  } else {
    notificationSocket.auth = { token };
  }

  if (!notificationSocket.connected) notificationSocket.connect();
  return notificationSocket;
};

export const disconnectNotificationRealtimeSocket = () => {
  notificationSocket?.disconnect();
  notificationSocket = undefined;
};
