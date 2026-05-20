import { io, type Socket } from 'socket.io-client';

import { getSocketBaseUrl } from '../api/socket-base-url';
import { useAuthStore } from '../../stores/auth-store';

let socket: Socket | undefined;

export function getRealtimeSocket() {
  const token = useAuthStore.getState().accessToken;
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
}

export function disconnectRealtimeSocket() {
  socket?.removeAllListeners();
  socket?.disconnect();
  socket = undefined;
}
