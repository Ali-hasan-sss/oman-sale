const STORAGE_KEY = 'oman_sale_device_id';

export const getDeviceId = () => {
  if (typeof window === 'undefined') return undefined;

  const existing = window.localStorage.getItem(STORAGE_KEY);
  if (existing) return existing;

  const id = crypto.randomUUID();
  window.localStorage.setItem(STORAGE_KEY, id);
  return id;
};
