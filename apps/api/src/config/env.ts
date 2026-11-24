import crypto from 'node:crypto';
import dotenv from 'dotenv';

dotenv.config();

const nodeEnv = process.env.NODE_ENV ?? 'development';

function resolveSessionSecret(): string {
  const configured = process.env.SESSION_SECRET?.trim();
  if (configured && configured.length >= 32) {
    return configured;
  }
  if (nodeEnv === 'production') {
    throw new Error(
      'SECURITY ERROR: SESSION_SECRET must be set to a random value (>= 32 chars) in production.',
    );
  }
  // Ephemeral random secret per dev/test process (never a hardcoded static string)
  return crypto.randomBytes(32).toString('hex');
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv,
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  supabaseUrl: process.env.SUPABASE_URL ?? 'https://ufxlojhllrvbtcrgfxsn.supabase.co',
  supabasePublishableKey:
    process.env.SUPABASE_PUBLISHABLE_KEY ?? 'sb_publishable_Qzyj0IDA7UArvDOIooaJgw_p-EQDDdv',
  supabaseSecretKey: process.env.SUPABASE_SECRET_KEY ?? '',
  aiServiceUrl: process.env.AI_SERVICE_URL ?? 'http://localhost:8000',
  aiProvider: process.env.AI_PROVIDER ?? 'local-deterministic',
  sessionSecret: resolveSessionSecret(),
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 200),
};
