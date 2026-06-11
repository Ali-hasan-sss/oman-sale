export const ADMIN_PENDING_COUNTS_EVENT = 'admin-pending-counts-changed';

export function notifyAdminPendingCountsChanged() {
  window.dispatchEvent(new Event(ADMIN_PENDING_COUNTS_EVENT));
}
