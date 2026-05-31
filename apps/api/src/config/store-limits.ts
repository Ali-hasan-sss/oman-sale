import { env } from './env';

export const getMaxStoresPerUser = () => env.STORES_MAX_PER_USER;
