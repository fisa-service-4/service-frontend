import type { ApiResponse } from '@/types/auth';
import { tokenUtils } from '@/utils/token';

export async function baasRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  if (typeof window === 'undefined') throw new Error('클라이언트에서만 호출 가능합니다.');

  const { headers: customHeaders, ...fetchOptions } = options;
  const token = tokenUtils.getAccessToken();
  const firebaseUid = tokenUtils.getFirebaseUid();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(firebaseUid ? { 'X-Firebase-Uid': firebaseUid } : {}),
    ...(customHeaders as Record<string, string> ?? {}),
  };

  const response = await fetch(`/baas/v1${path}`, {
    ...fetchOptions,
    headers,
  });

  const json: ApiResponse<T> = await response.json();

  if (!json.success) {
    throw new Error(json.error?.message ?? '요청 처리 중 오류가 발생했습니다.');
  }

  return json.data;
}
