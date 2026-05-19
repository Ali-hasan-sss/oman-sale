import path from 'node:path';

import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env'), override: true });
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1),
  PROMOTION_EXPIRY_INTERVAL_MS: z.coerce.number().int().positive().default(300_000)
});

export const env = envSchema.parse(process.env);
