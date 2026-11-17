import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from root or local
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5001),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  BACKEND_URL: z.string().default('http://localhost:5001'),
  DATABASE_URL: z
    .string()
    .default('postgresql://postgres:postgres@localhost:5432/ai_lead_finder?schema=public'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters').default('development-secret-key-32-characters-min'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  GEMINI_API_KEY: z.string().optional().default(''),
  GEMINI_MODEL: z.string().default('gemini-1.5-flash'),
  X_BEARER_TOKEN: z.string().optional().default(''),
  MAX_SEARCH_RESULTS_PER_RUN: z.coerce.number().default(50),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', JSON.stringify(parsedEnv.error.format(), null, 2));
  throw new Error('Environment variable validation failed');
}

export const env = parsedEnv.data;
