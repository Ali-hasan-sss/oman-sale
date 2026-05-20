/** Central registry of backend routes (`/api/v1` prefix applied by the HTTP client). */
export const API_ENDPOINTS = {
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    refresh: '/auth/refresh',
    verifyEmail: '/auth/verify-email',
    resendVerification: '/auth/resend-verification',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password'
  },
  users: {
    me: '/users/me',
    changePassword: '/users/me/password',
    requestEmailChange: '/users/me/email-change',
    verifyEmailChange: '/users/me/email-change/verify'
  },
  ads: {
    root: '/ads',
    all: '/ads/all',
    latest: '/ads/latest',
    featured: '/ads/featured',
    my: '/ads/my',
    favorites: '/ads/favorites',
    favoriteIds: '/ads/favorites/ids',
    byId: (id: string) => `/ads/${id}`,
    similar: (id: string) => `/ads/${id}/similar`,
    favorite: (id: string) => `/ads/${id}/favorite`,
    promote: (id: string) => `/ads/${id}/promote`
  },
  categories: {
    list: '/categories',
    filters: (id: string) => `/categories/${id}/filters`
  },
  search: {
    ads: '/search/ads'
  },
  chat: {
    conversations: '/chat/conversations',
    unreadCount: '/chat/unread-count',
    start: '/chat/conversations/start',
    messages: (conversationId: string) => `/chat/conversations/${conversationId}/messages`,
    read: (conversationId: string) => `/chat/conversations/${conversationId}/read`,
    block: (conversationId: string) => `/chat/conversations/${conversationId}/block`,
    unblock: (conversationId: string) => `/chat/conversations/${conversationId}/unblock`
  },
  notifications: {
    list: '/notifications',
    readAll: '/notifications/read-all'
  },
  hero: {
    slides: '/hero/slides',
    banners: '/hero/banners'
  },
  promotions: {
    plans: '/promotions/plans'
  },
  tourism: {
    destinations: '/tourism/destinations',
    destination: (idOrSlug: string) => `/tourism/destinations/${idOrSlug}`
  }
} as const;

/** Routes that must not trigger automatic token refresh on 401. */
export const AUTH_PUBLIC_PATHS = [
  API_ENDPOINTS.auth.register,
  API_ENDPOINTS.auth.login,
  API_ENDPOINTS.auth.refresh,
  API_ENDPOINTS.auth.verifyEmail,
  API_ENDPOINTS.auth.resendVerification,
  API_ENDPOINTS.auth.forgotPassword,
  API_ENDPOINTS.auth.resetPassword
] as const;
