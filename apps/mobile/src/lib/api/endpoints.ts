/** Central registry of backend routes (`/api/v1` prefix applied by the HTTP client). */
export const API_ENDPOINTS = {
  auth: {
    register: '/auth/register',
    registerStart: '/auth/register/start',
    registerVerifyEmail: '/auth/register/verify-email',
    registerResendEmail: '/auth/register/resend-email',
    registerSendPhone: '/auth/register/send-phone-code',
    registerVerifyPhone: '/auth/register/verify-phone',
    registerResendPhone: '/auth/register/resend-phone',
    login: '/auth/login',
    google: '/auth/google',
    refresh: '/auth/refresh',
    verifyEmail: '/auth/verify-email',
    resendVerification: '/auth/resend-verification',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    completeProfileSendPhone: '/auth/complete-profile/send-phone',
    completeProfileVerifyPhone: '/auth/complete-profile/verify-phone',
    completeProfile: '/auth/complete-profile'
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
    report: (id: string) => `/ads/${id}/reports`,
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
    conversationById: (conversationId: string) => `/chat/conversations/${conversationId}`,
    unreadCount: '/chat/unread-count',
    messages: (conversationId: string) => `/chat/conversations/${conversationId}/messages`,
    sendMessage: '/chat/messages',
    read: (conversationId: string) => `/chat/conversations/${conversationId}/read`,
    block: (conversationId: string) => `/chat/conversations/${conversationId}/block`,
    unblock: (conversationId: string) => `/chat/conversations/${conversationId}/unblock`
  },
  notifications: {
    list: '/notifications',
    readAll: '/notifications/read-all',
    unreadCount: '/notifications/unread-count',
    pushToken: '/notifications/push-token',
    read: (id: string) => `/notifications/${id}/read`
  },
  hero: {
    slides: '/hero/slides',
    banners: '/hero/banners'
  },
  promotions: {
    plans: '/promotions/plans',
    adPromotions: '/promotions/ad-promotions'
  },
  stores: {
    root: '/stores',
    plans: '/stores/plans',
    storeTypes: '/store-types',
    confirmPayment: '/stores/payments/thawani/confirm',
    mine: '/stores/me',
    byId: (id: string) => `/stores/${id}`,
    bySlug: (slug: string) => `/stores/slug/${slug}`,
    ads: (id: string) => `/stores/${id}/ads`,
    adsBySlug: (slug: string) => `/stores/slug/${slug}/ads`,
    activatePaid: (id: string) => `/stores/${id}/activate-paid`,
    subscribe: (id: string) => `/stores/${id}/subscribe`,
    renewSubscription: (id: string) => `/stores/${id}/renew-subscription`
  },
  tourism: {
    destinations: '/tourism/destinations',
    destination: (idOrSlug: string) => `/tourism/destinations/${idOrSlug}`
  },
  assistant: {
    chat: '/assistant/chat',
    quickReply: '/assistant/quick-reply'
  },
  articles: {
    list: '/articles',
    categories: '/articles/categories',
    bySlug: (slug: string) => `/articles/${slug}`,
    comments: (articleId: string) => `/articles/${articleId}/comments`,
    comment: (articleId: string, commentId: string) => `/articles/${articleId}/comments/${commentId}`,
    reactions: (articleId: string) => `/articles/${articleId}/reactions`
  },
  legal: {
    byKind: (kind: 'terms' | 'privacy') => `/legal/${kind}`
  },
  trustBadge: {
    userMe: '/trust-badge/users/me',
    store: (storeId: string) => `/trust-badge/stores/${storeId}`
  },
  media: {
    upload: '/media/upload'
  }
} as const;

/** Routes that must not trigger automatic token refresh on 401. */
export const AUTH_PUBLIC_PATHS = [
  API_ENDPOINTS.auth.register,
  API_ENDPOINTS.auth.registerStart,
  API_ENDPOINTS.auth.registerVerifyEmail,
  API_ENDPOINTS.auth.registerResendEmail,
  API_ENDPOINTS.auth.registerSendPhone,
  API_ENDPOINTS.auth.registerVerifyPhone,
  API_ENDPOINTS.auth.registerResendPhone,
  API_ENDPOINTS.auth.login,
  API_ENDPOINTS.auth.google,
  API_ENDPOINTS.auth.refresh,
  API_ENDPOINTS.auth.verifyEmail,
  API_ENDPOINTS.auth.resendVerification,
  API_ENDPOINTS.auth.forgotPassword,
  API_ENDPOINTS.auth.resetPassword
] as const;
