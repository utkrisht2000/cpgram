import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export type UserRole = 'citizen' | 'redressal_officer' | 'nodal_officer';

export interface TokenPayload {
  userId: string;
  role: UserRole;
  phone?: string;
  email?: string;
  departmentId?: string | null;
  name?: string | null;
}

export const SessionManager = {
  // Generate signed JWT token containing user identity and role claims
  createToken(payload: TokenPayload): string {
    return jwt.sign(payload, env.jwtSecret, {
      expiresIn: env.jwtExpiresIn as any,
    });
  },

  // Verify and decode signed JWT token
  verifyToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, env.jwtSecret) as TokenPayload;
    } catch {
      return null;
    }
  }
};
