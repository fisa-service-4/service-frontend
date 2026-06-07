import type { ApiResponse } from '@/types/auth';
import { tokenUtils, adminTokenUtils } from './token';
import { tryRefreshToken, redirectToLogin } from './tokenRefresh';

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { skipAuth?: boolean } = {}
): Promise<T> {
  const { skipAuth, headers: customHeaders, ...fetchOptions } = options;

  const buildHeaders = (): Record<string, string> => {
    const token = tokenUtils.getAccessToken();
    return {
      'Content-Type': 'application/json',
      ...(token && !skipAuth ? { Authorization: `Bearer ${token}` } : {}),
      ...(customHeaders as Record<string, string> ?? {}),
    };
  };

  const response = await fetch(`/api/v1${path}`, {
    ...fetchOptions,
    headers: buildHeaders(),
  });

  if (response.status === 401 && !skipAuth) {
    const refreshed = await tryRefreshToken();
    if (!refreshed) {
      redirectToLogin();
      throw new Error('세션이 만료되었습니다. 다시 로그인해 주세요.');
    }
    const retry = await fetch(`/api/v1${path}`, {
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

export async function adminApiRequest<T>(
  path: string,
  options: RequestInit & { skipAuth?: boolean } = {}
): Promise<T> {
  const { skipAuth, headers: customHeaders, ...fetchOptions } = options;

  const buildHeaders = (): Record<string, string> => {
    const token = adminTokenUtils.getAccessToken();
    return {
      'Content-Type': 'application/json',
      ...(token && !skipAuth ? { Authorization: `Bearer ${token}` } : {}),
      ...(customHeaders as Record<string, string> ?? {}),
    };
  };

  const response = await fetch(`/api/v1${path}`, {
    ...fetchOptions,
    headers: buildHeaders(),
  });

  const json: ApiResponse<T> = await response.json();
  if (!json.success) throw new Error(json.error?.message ?? '요청 처리 중 오류가 발생했습니다.');
  return json.data;
}
