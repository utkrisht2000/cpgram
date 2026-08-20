import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  databasePath: process.env.DATABASE_PATH || path.resolve(__dirname, '../db/sqlite.db'),
  jwtSecret: process.env.JWT_SECRET || 'sugam_jwt_default_secret_key_change_in_production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  otpSecret: process.env.OTP_SECRET || 'sugam_otp_default_hmac_secret',
  otpExpiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10),
  otpMaxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS || '5', 10),
  groqApiKey: process.env.GROQ_API_KEY || process.env.OPENROUTER_API_KEY || '',
  groqModel: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  groqBaseUrl: process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1',
  aiTimeoutMs: parseInt(process.env.AI_TIMEOUT_MS || '15000', 10),
  aiMaxRetries: parseInt(process.env.AI_MAX_RETRIES || '1', 10),
};
