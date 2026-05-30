import { tokenUtils } from './token';

let refreshPromise: Promise<boolean> | null = null;

export async function tryRefreshToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const refreshToken = tokenUtils.getRefreshToken();
      if (!refreshToken) return false;

      const res = await fetch('/api/v1/auth/reissue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      const json = await res.json();
      if (!json.success || !json.data?.accessToken) return false;

      tokenUtils.setTokens(json.data.accessToken, refreshToken);
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export function redirectToLogin() {
  tokenUtils.clearTokens();
  window.location.href = '/login';
}
