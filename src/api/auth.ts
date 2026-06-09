import { apiRequest } from '@/utils/apiClient';
import type {
  LoginRequest, LoginResponse,
  SignupRequest, SignupResponse,
  TokenPair, PhoneSendRequest, RegisterPinRequest,
} from '@/types/auth';

export const authApi = {
  login: (data: LoginRequest) =>
    apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
      skipAuth: true,
    }),

  signup: (data: SignupRequest) =>
    apiRequest<SignupResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
      skipAuth: true,
    }),

  signupComplete: () =>
    apiRequest<string>('/auth/signup/complete', { method: 'POST' }),

  phoneSend: (data: PhoneSendRequest) =>
    apiRequest<string>('/auth/phone/send', {
      method: 'POST',
      body: JSON.stringify(data),
      skipAuth: true,
    }),

  phoneVerify: (phoneNumber: string, code: string) =>
    apiRequest<string>('/auth/phone/verify', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, code }),
      skipAuth: true,
    }),

  registerPin: (data: RegisterPinRequest) =>
    apiRequest<string>('/auth/pin', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  verifyPin: (pin: string) =>
    apiRequest<string>('/auth/pin/verify', {
      method: 'POST',
      body: JSON.stringify({ pin }),
    }),

  getPinStatus: () =>
    apiRequest<{ lockedYn: boolean; failCount: number }>('/auth/pin/status', {
      method: 'GET',
    }),

  changePin: (currentPin: string, newPin: string) =>
    apiRequest<string>('/auth/pin', {
      method: 'PATCH',
      body: JSON.stringify({ currentPin, newPin }),
    }),

  logout: () =>
    apiRequest<string>('/auth/logout', { method: 'POST' }),

  reissue: (refreshToken: string) =>
    apiRequest<TokenPair>('/auth/reissue', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
      skipAuth: true,
    }),

  adminSignup: (data: { email: string; password: string; userName: string }) =>
    apiRequest<SignupResponse>('/auth/admin/signup', {
      method: 'POST',
      body: JSON.stringify(data),
      skipAuth: true,
    }),
};
