import path from 'node:path';

import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env'), override: true });
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default('0.0.0.0'),
  TRUST_PROXY: z
    .preprocess((value) => {
      if (value === undefined || value === '') return 1;
      if (value === 'true') return true;
      if (value === 'false') return false;
      if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value);
      return value;
    }, z.union([z.boolean(), z.number(), z.string()]))
    .default(1),
  API_URL: z.string().url().default('http://localhost:4000'),
  WEB_URL: z.string().url().default('http://localhost:3000'),
  CORS_ORIGINS: z.string().optional(),
  CORS_ALLOW_LAN_IN_DEV: z
    .preprocess((value) => {
      if (value === 'true') return true;
      if (value === 'false') return false;
      return value;
    }, z.boolean())
    .default(true),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1).default('redis://localhost:6379'),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  PASSWORD_SALT_ROUNDS: z.coerce.number().default(12),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().default(120),
  MEDIA_PROVIDER: z.enum(['local', 'cloudinary', 's3']).default('local'),
  EMAIL_SKIP_SEND: z.preprocess((value) => value === 'true', z.boolean()).default(true),
  EMAIL_SKIP_CODE: z.string().default('000000'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z.preprocess((value) => value === 'true', z.boolean()).default(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default('Oman Sale <no-reply@omansale.local>')
});

export const env = envSchema.parse(process.env);
