import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  JWT_SECRET: z.string().default('union-ai-super-secret-key-change-in-production-2026'),
  DB_PATH: z.string().default('./data/union.db'),
  GROQ_API_KEY: z.string().optional(),
  GROQ_MODEL: z.string().default('openai/gpt-oss-120b'),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  // Email & Password Reset
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('UNION.AI <noreply@union.ai>'),
  APP_URL: z.string().default('http://localhost:1590'),
  // Payment Gateways
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  MERCADO_PAGO_ACCESS_TOKEN: z.string().optional(),
  MERCADO_PAGO_WEBHOOK_SECRET: z.string().optional(),
  // Supabase Cloud Database (PostgreSQL)
  SUPABASE_URL: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  DATABASE_URL: z.string().url().optional(),
  DB_SSL: z.enum(['require', 'disable']).default('require'),
  DB_POOL_MAX: z.coerce.number().int().min(1).max(50).default(5),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GROQ_INPUT_CREDITS_PER_MILLION: z.coerce.number().nonnegative().default(1),
  GROQ_OUTPUT_CREDITS_PER_MILLION: z.coerce.number().nonnegative().default(2)
}).refine(data => {
  if (data.NODE_ENV === 'production') {
    if (data.JWT_SECRET === 'union-ai-super-secret-key-change-in-production-2026' || data.JWT_SECRET.length < 32) {
      return false;
    }
  }
  return true;
}, {
  message: 'Em ambiente de produção (NODE_ENV=production), JWT_SECRET não pode utilizar o valor padrão e deve conter pelo menos 32 caracteres seguros.',
  path: ['JWT_SECRET']
});

export const env = EnvSchema.parse(process.env);
