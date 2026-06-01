const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_ID_KEY = 'userId';
const FIREBASE_UID_KEY = 'firebaseUid';

export const tokenUtils = {
  setTokens: (accessToken: string, refreshToken: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },
  getAccessToken: (): string | null => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY),
  setUserId: (userId: number) => localStorage.setItem(USER_ID_KEY, String(userId)),
  getUserId: (): number | null => {
    const val = localStorage.getItem(USER_ID_KEY);
    return val ? Number(val) : null;
  },
  setFirebaseUid: (uid: string) => localStorage.setItem(FIREBASE_UID_KEY, uid),
  getFirebaseUid: (): string | null => localStorage.getItem(FIREBASE_UID_KEY),
  clearTokens: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_ID_KEY);
    localStorage.removeItem(FIREBASE_UID_KEY);
  },
};
