import bcrypt from 'bcryptjs';

import { env } from '../../config/env';

export const hashPassword = (password: string) => bcrypt.hash(password, env.PASSWORD_SALT_ROUNDS);

export const verifyPassword = (password: string, hash: string) => bcrypt.compare(password, hash);
