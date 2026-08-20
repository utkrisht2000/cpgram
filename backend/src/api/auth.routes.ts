import { Router, Response } from 'express';
import { z } from 'zod';
import { UserModel } from '../models/user.model';
import { OfficerModel } from '../models/officer.model';
import { otpProvider } from '../auth/otpProvider';
import { PasswordAuth } from '../auth/passwordAuth';
import { SessionManager } from '../auth/session';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';

export const authRouter = Router();

const requestOtpSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number.'),
});

const verifyOtpSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number.'),
  otp: z.string().min(4).max(8),
  name: z.string().optional(),
  language: z.string().optional(),
});

const officerLoginSchema = z.object({
  email: z.string().email('Please enter a valid official email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

// Citizen: Request OTP
authRouter.post('/citizen/request-otp', async (req, res, next) => {
  try {
    const { phone } = requestOtpSchema.parse(req.body);
    const result = await otpProvider.sendOtp(phone);
    if (!result.success) {
      return res.status(429).json({ error: result.message });
    }

    res.json({
      message: result.message,
      phone,
      devOtp: result.devOtp,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    next(err);
  }
});

// Citizen: Verify OTP & Login / Register
authRouter.post('/citizen/verify-otp', async (req, res, next) => {
  try {
    const { phone, otp, name, language } = verifyOtpSchema.parse(req.body);
    const verifyResult = await otpProvider.verifyOtp(phone, otp);

    if (!verifyResult.isValid) {
      return res.status(400).json({ error: verifyResult.error || 'Invalid OTP code.' });
    }

    let user = UserModel.findByPhone(phone);
    if (!user) {
      const newId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      user = UserModel.create(newId, phone, name || null, language || 'en');
    } else {
      if (name && !user.name) {
        UserModel.updateName(user.id, name);
        user.name = name;
      }
      if (language && user.language_preference !== language) {
        UserModel.updateLanguage(user.id, language);
        user.language_preference = language;
      }
    }

    const token = SessionManager.createToken({
      userId: user.id,
      role: 'citizen',
      phone: user.phone,
      name: user.name,
    });

    res.json({
      token,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        language_preference: user.language_preference,
        role: 'citizen',
      },
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    next(err);
  }
});

// Officer & Nodal: Email/Password Login
authRouter.post('/officer/login', async (req, res, next) => {
  try {
    const { email, password } = officerLoginSchema.parse(req.body);
    const officer = OfficerModel.findByEmail(email.toLowerCase().trim());

    if (!officer) {
      return res.status(401).json({ error: 'Invalid official credentials.' });
    }

    const isValidPassword = await PasswordAuth.verify(password, officer.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid official credentials.' });
    }

    const token = SessionManager.createToken({
      userId: officer.id,
      role: officer.role,
      email: officer.email,
      departmentId: officer.department_id,
      name: officer.name,
    });

    res.json({
      token,
      user: {
        id: officer.id,
        email: officer.email,
        name: officer.name,
        role: officer.role,
        department_id: officer.department_id,
      },
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    next(err);
  }
});

// Session Validation Endpoint
authRouter.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Session expired.' });
  }

  if (req.user.role === 'citizen') {
    const user = UserModel.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }
    return res.json({
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        language_preference: user.language_preference,
        role: 'citizen',
      },
    });
  } else {
    const officer = OfficerModel.findById(req.user.userId);
    if (!officer) {
      return res.status(404).json({ error: 'Officer profile not found.' });
    }
    return res.json({
      user: {
        id: officer.id,
        email: officer.email,
        name: officer.name,
        role: officer.role,
        department_id: officer.department_id,
      },
    });
  }
});
