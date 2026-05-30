export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: { code: string; message: string } | null;
  meta: { traceId: string };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  userId: number;
  userName: string;
  role: string;
  firebaseUid?: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  userName: string;
  phoneNumber: string;
  freelancerYn: boolean;
  jobType: string;
  termsConsentYn: boolean;
}

export interface SignupResponse {
  userId: number;
  email: string;
  userName: string;
}

export interface UserProfile {
  userId: number;
  email: string;
  userName: string;
  phoneNumber: string;
  role: string;
  status: string;
  notificationConsentYn: boolean;
  mydataConsentYn: boolean;
  freelancerYn: boolean;
  jobType: string;
  createdAt: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface PhoneSendRequest {
  name: string;
  residentNumber: string;
  telecom: string;
  phoneNumber: string;
}

export interface RegisterPinRequest {
  pin: string;
  pinConfirm: string;
}
