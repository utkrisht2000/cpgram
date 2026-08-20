import { apiRequest } from './client';

export interface UserSession {
  id: string;
  phone?: string;
  email?: string;
  name: string | null;
  role: 'citizen' | 'redressal_officer' | 'nodal_officer';
  language_preference?: string;
  department_id?: string | null;
}

export interface AuthResponse {
  token: string;
  user: UserSession;
}

export const authApi = {
  requestOtp(phone: string): Promise<{ message: string; devOtp?: string }> {
    return apiRequest('/auth/citizen/request-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  },

  verifyOtp(phone: string, otp: string, name?: string, language?: string): Promise<AuthResponse> {
    return apiRequest('/auth/citizen/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, otp, name, language }),
    });
  },

  officerLogin(email: string, password: string): Promise<AuthResponse> {
    return apiRequest('/auth/officer/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  getMe(): Promise<{ user: UserSession }> {
    return apiRequest('/auth/me');
  },
};
