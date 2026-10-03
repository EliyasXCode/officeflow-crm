import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/officeflow-crm'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters long').default('super_secret_officeflow_jwt_key_2026_dev_mode'),
  SESSION_SECRET: z.string().min(16, 'SESSION_SECRET must be at least 16 characters long').default('super_secret_officeflow_session_key_2026_dev_mode'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  ENABLE_AI_ASSISTANT: z.string().transform((v) => v === 'true').default('false'),
  GEMINI_API_KEY: z.string().optional(),
  DEFAULT_OFFICE_TIMEZONE: z.string().default('Asia/Kolkata'),
  DEFAULT_CURRENCY: z.string().default('INR'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const ENV = parsed.data;
