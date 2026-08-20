import crypto from 'crypto';
import { db } from '../db/connection';
import { env } from '../config/env';

export interface OtpDeliveryResult {
  success: boolean;
  message: string;
  devOtp?: string;
}

export interface OtpVerificationResult {
  isValid: boolean;
  error?: string;
}

export interface OtpProviderInterface {
  sendOtp(phone: string): Promise<OtpDeliveryResult>;
  verifyOtp(phone: string, inputOtp: string): Promise<OtpVerificationResult>;
}

export class DefaultOtpProvider implements OtpProviderInterface {
  private hashOtp(phone: string, otp: string): string {
    return crypto
      .createHmac('sha256', env.otpSecret)
      .update(`${phone}:${otp}`)
      .digest('hex');
  }

  async sendOtp(phone: string): Promise<OtpDeliveryResult> {
    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = this.hashOtp(phone, otp);
    const expiresAt = new Date(Date.now() + env.otpExpiryMinutes * 60 * 1000).toISOString();

    // Check rate limit / existing attempts
    const existing = db.prepare('SELECT * FROM otps WHERE phone = ?').get(phone) as any;
    if (existing && new Date(existing.expires_at) > new Date() && existing.attempts >= env.otpMaxAttempts) {
      return {
        success: false,
        message: 'Maximum OTP verification attempts exceeded. Please wait a few minutes before requesting a new code.',
      };
    }

    db.prepare(`
      INSERT INTO otps (phone, otp_hash, expires_at, attempts, created_at)
      VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP)
      ON CONFLICT(phone) DO UPDATE SET
        otp_hash = excluded.otp_hash,
        expires_at = excluded.expires_at,
        attempts = 0,
        created_at = CURRENT_TIMESTAMP
    `).run(phone, otpHash, expiresAt);

    // Development logging when no commercial SMS provider is configured
    if (env.nodeEnv !== 'production' || !process.env.SMS_API_KEY) {
      console.log(`[SuGam OTP Service] Verification code for ${phone}: ${otp} (valid for ${env.otpExpiryMinutes} minutes)`);
      return {
        success: true,
        message: 'Verification code generated.',
        devOtp: env.nodeEnv === 'development' ? otp : undefined,
      };
    }

    return {
      success: true,
      message: 'Verification code dispatched to your mobile number.',
    };
  }

  async verifyOtp(phone: string, inputOtp: string): Promise<OtpVerificationResult> {
    const record = db.prepare('SELECT * FROM otps WHERE phone = ?').get(phone) as any;
    if (!record) {
      return { isValid: false, error: 'No OTP request found for this phone number.' };
    }

    if (new Date(record.expires_at) < new Date()) {
      return { isValid: false, error: 'OTP has expired. Please request a new code.' };
    }

    if (record.attempts >= env.otpMaxAttempts) {
      return { isValid: false, error: 'Maximum attempts exceeded. Please request a new OTP.' };
    }

    const calculatedHash = this.hashOtp(phone, inputOtp.trim());
    if (calculatedHash !== record.otp_hash) {
      db.prepare('UPDATE otps SET attempts = attempts + 1 WHERE phone = ?').run(phone);
      const remaining = env.otpMaxAttempts - (record.attempts + 1);
      return {
        isValid: false,
        error: `Incorrect OTP code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`,
      };
    }

    // Invalidate consumed OTP
    db.prepare('DELETE FROM otps WHERE phone = ?').run(phone);
    return { isValid: true };
  }
}

export const otpProvider = new DefaultOtpProvider();
