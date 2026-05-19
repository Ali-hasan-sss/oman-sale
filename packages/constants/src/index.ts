export const DEFAULT_CURRENCY = 'OMR';

export const DOMAIN_EVENTS = {
  PAYMENT_SUCCESS: 'PAYMENT_SUCCESS',
  AD_APPROVED: 'AD_APPROVED',
  AD_REJECTED: 'AD_REJECTED',
  MESSAGE_SENT: 'MESSAGE_SENT',
  PROMOTION_ACTIVATED: 'PROMOTION_ACTIVATED'
} as const;

export const SOCKET_EVENTS = {
  JOIN_CONVERSATION: 'conversation:join',
  LEAVE_CONVERSATION: 'conversation:leave',
  MESSAGE_SENT: 'message:sent',
  MESSAGE_RECEIVED: 'message:received',
  TYPING_STARTED: 'typing:started',
  TYPING_STOPPED: 'typing:stopped'
} as const;
