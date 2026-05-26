import type { ApiResponse } from '@/types/auth';

function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

export async function mydataRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const { headers: customHeaders, ...fetchOptions } = options;
  const token = getAccessToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
