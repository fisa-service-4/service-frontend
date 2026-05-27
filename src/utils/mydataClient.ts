import type { ApiResponse } from '@/types/auth';
import { tokenUtils } from '@/utils/token';

export async function mydataRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  if (typeof window === 'undefined') throw new Error('클라이언트에서만 호출 가능합니다.');

  const { headers: customHeaders, ...fetchOptions } = options;
  const token = tokenUtils.getAccessToken();
  const userId = tokenUtils.getUserId();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(userId ? { 'X-User-Id': String(userId) } : {}),
    ...(customHeaders as Record<string, string> ?? {}),
  };

  const response = await fetch(`/mydata/v1${path}`, {
    ...fetchOptions,
    headers,
  });

  const json: ApiResponse<T> = await response.json();

  if (!json.success) {
    throw new Error(json.error?.message ?? '요청 처리 중 오류가 발생했습니다.');
  }

  return json.data;
}
