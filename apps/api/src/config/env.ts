import path from 'node:path';

import dotenv from 'dotenv';
import { z } from 'zod';

for (const envPath of [
  path.resolve(__dirname, '../../../.env'),
  path.resolve(process.cwd(), '../../.env'),
  path.resolve(process.cwd(), '.env')
]) {
  dotenv.config({ path: envPath });
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  /**
   * Run the BullMQ queue workers inside the API process. Defaults to ON outside
   * production so a single `npm run dev` delivers emails, push and realtime jobs.
   * In production keep this OFF and run a dedicated worker (`start:worker`).
   */
  WORKERS_INLINE: z.preprocess(
    (value) => (value === undefined ? undefined : value === 'true'),
    z.boolean().optional()
  ),
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
  /** When true, phone verification accepts 000000 without sending SMS. */
  PHONE_SKIP_VERIFY: z.preprocess((value) => value === 'true', z.boolean()).default(false),
  /** Twilio Verify for phone OTP (registration, store creation) — no Twilio phone number needed. */
  TWILIO_ENABLED: z.preprocess((value) => value === 'true', z.boolean()).default(false),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  /** Verify Service SID from Twilio Console (starts with VA...). */
  TWILIO_VERIFY_SERVICE_SID: z.string().optional(),
  /** Meta WhatsApp Cloud API (optional notifications only) — see docs/whatsapp-meta-setup.html */
  WHATSAPP_ENABLED: z.preprocess((value) => value === 'true', z.boolean()).default(false),
  WHATSAPP_API_VERSION: z.string().default('v21.0'),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_ACCESS_TOKEN: z.string().optional(),
  WHATSAPP_OTP_TEMPLATE_NAME: z.string().default('oman_sale_otp'),
  WHATSAPP_OTP_TEMPLATE_LANGUAGE: z.string().default('ar'),
  WHATSAPP_OTP_TEMPLATE_LANGUAGE_EN: z.string().optional(),
  /** Set true if the approved OTP template includes a URL/copy button (index 0). */
  WHATSAPP_OTP_TEMPLATE_HAS_BUTTON: z.preprocess((value) => value === 'true', z.boolean()).default(true),
  WHATSAPP_NOTIFICATION_TEMPLATE_NAME: z.string().optional(),
  WHATSAPP_NOTIFICATION_TEMPLATE_LANGUAGE: z.string().default('ar'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z.preprocess((value) => value === 'true', z.boolean()).default(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default('Oman Sale <no-reply@omansale.local>'),
  THAWANI_SECRET_KEY: z.string().optional(),
  THAWANI_PUBLISHABLE_KEY: z.string().optional(),
  THAWANI_SANDBOX: z.preprocess((value) => value !== 'false', z.boolean()).default(true),
  THAWANI_SKIP_CHECKOUT: z.preprocess((value) => value === 'true', z.boolean()).default(false),
  /** Max stores a user may own. Increase later to allow multiple stores per account. */
  STORES_MAX_PER_USER: z.coerce.number().int().positive().default(1),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  ASSISTANT_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(30),
  ASSISTANT_DAILY_LIMIT_AUTH: z.coerce.number().int().positive().default(30),
  ASSISTANT_DAILY_LIMIT_GUEST: z.coerce.number().int().positive().default(10),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  AWS_S3_PREFIX: z.string().default('oman-sale'),
  MEDIA_PUBLIC_BASE_URL: z.string().url().optional(),
  /** private = serve via API proxy (default, works with blocked public S3). public = direct S3 URLs. */
  MEDIA_S3_ACCESS: z.enum(['private', 'public']).default('private'),
  ADMIN_NOTIFICATION_EMAIL: z.string().email().default('info@omansale.om'),
  FIREBASE_PROJECT_ID: z.string().optional(),
  /** JSON string of Firebase service account (single line). Required for Google sign-in token verification. */
  FIREBASE_SERVICE_ACCOUNT_JSON: z.string().optional()
});

export const env = envSchema.parse(process.env);
