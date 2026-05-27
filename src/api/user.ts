import { apiRequest } from '@/utils/apiClient';
import type { UserProfile } from '@/types/auth';

export const userApi = {
  getMe: () => apiRequest<UserProfile>('/users/me'),

  updateProfile: (data: { userName?: string; freelancerYn?: boolean; jobType?: string }) =>
    apiRequest<UserProfile>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  updateAlarm: (notificationConsentYn: boolean) =>
    apiRequest<{ notificationConsentYn: boolean }>('/users/me/alarm', {
      method: 'PATCH',
      body: JSON.stringify({ notificationConsentYn }),
    }),

  deleteAccount: () =>
    apiRequest<string>('/users/me', { method: 'DELETE' }),
};
