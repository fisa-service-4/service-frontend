import type { ApiResponse } from '@/types/auth';
import { tokenUtils } from '@/utils/token';
import { tryRefreshToken, redirectToLogin } from '@/utils/tokenRefresh';

export async function baasRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  if (typeof window === 'undefined') throw new Error('클라이언트에서만 호출 가능합니다.');

  const { headers: customHeaders, ...fetchOptions } = options;

  const buildHeaders = (): Record<string, string> => {
    const token = tokenUtils.getAccessToken();
    const firebaseUid = tokenUtils.getFirebaseUid();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(firebaseUid ? { 'X-Firebase-Uid': firebaseUid } : {}),
      ...(customHeaders as Record<string, string> ?? {}),
    };
  };

  const response = await fetch(`/baas/v1${path}`, {
    ...fetchOptions,
    headers: buildHeaders(),
  });

  if (response.status === 401) {
    const refreshed = await tryRefreshToken();
    if (!refreshed) {
      redirectToLogin();
      throw new Error('세션이 만료되었습니다. 다시 로그인해 주세요.');
    }
    const retry = await fetch(`/baas/v1${path}`, {
      ...fetchOptions,
      headers: buildHeaders(),
    });
    const retryJson: ApiResponse<T> = await retry.json();
    if (!retryJson.success) throw new Error(retryJson.error?.message ?? '요청 처리 중 오류가 발생했습니다.');
    return retryJson.data;
  }

  const json: ApiResponse<T> = await response.json();
  if (!json.success) throw new Error(json.error?.message ?? '요청 처리 중 오류가 발생했습니다.');
  return json.data;
}
