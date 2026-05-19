import type { Server } from 'socket.io';

export const registerChatSocketHandlers = (io: Server) => {
  io.on('connection', (socket) => {
    socket.on('message:typing', ({ conversationId, userId }) => {
      socket.to(`conversation:${conversationId}`).emit('message:typing', { conversationId, userId });
    });
  });
};
