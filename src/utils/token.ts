const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_ID_KEY = 'userId';
const FIREBASE_UID_KEY = 'firebaseUid';
const USER_EMAIL_KEY = 'userEmail';
const USER_NAME_KEY = 'userName';

const ADMIN_ACCESS_TOKEN_KEY  = 'adminAccessToken';
const ADMIN_REFRESH_TOKEN_KEY = 'adminRefreshToken';
const ADMIN_USER_ID_KEY       = 'adminUserId';
const ADMIN_EMAIL_KEY         = 'adminEmail';
const ADMIN_NAME_KEY          = 'adminName';

export const tokenUtils = {
  setTokens: (accessToken: string, refreshToken: string) => {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },
  getAccessToken: (): string | null => sessionStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: (): string | null => sessionStorage.getItem(REFRESH_TOKEN_KEY),
  setUserId: (userId: number) => sessionStorage.setItem(USER_ID_KEY, String(userId)),
  getUserId: (): number | null => {
    const val = sessionStorage.getItem(USER_ID_KEY);
    return val ? Number(val) : null;
  },
  setFirebaseUid: (uid: string) => sessionStorage.setItem(FIREBASE_UID_KEY, uid),
  getFirebaseUid: (): string | null => sessionStorage.getItem(FIREBASE_UID_KEY),
  setUserEmail: (email: string) => sessionStorage.setItem(USER_EMAIL_KEY, email),
  getUserEmail: (): string | null => sessionStorage.getItem(USER_EMAIL_KEY),
  setUserName: (name: string) => sessionStorage.setItem(USER_NAME_KEY, name),
  getUserName: (): string | null => sessionStorage.getItem(USER_NAME_KEY),
  clearTokens: () => {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(USER_ID_KEY);
    sessionStorage.removeItem(FIREBASE_UID_KEY);
    sessionStorage.removeItem(USER_EMAIL_KEY);
    sessionStorage.removeItem(USER_NAME_KEY);
  },
};

export const adminTokenUtils = {
  setTokens: (accessToken: string, refreshToken: string) => {
    sessionStorage.setItem(ADMIN_ACCESS_TOKEN_KEY, accessToken);
    sessionStorage.setItem(ADMIN_REFRESH_TOKEN_KEY, refreshToken);
  },
  getAccessToken: (): string | null => sessionStorage.getItem(ADMIN_ACCESS_TOKEN_KEY),
  getRefreshToken: (): string | null => sessionStorage.getItem(ADMIN_REFRESH_TOKEN_KEY),
  setUserId: (userId: number) => sessionStorage.setItem(ADMIN_USER_ID_KEY, String(userId)),
  getUserId: (): number | null => {
    const val = sessionStorage.getItem(ADMIN_USER_ID_KEY);
    return val ? Number(val) : null;
  },
  setUserEmail: (email: string) => sessionStorage.setItem(ADMIN_EMAIL_KEY, email),
  getUserEmail: (): string | null => sessionStorage.getItem(ADMIN_EMAIL_KEY),
  setUserName: (name: string) => sessionStorage.setItem(ADMIN_NAME_KEY, name),
  getUserName: (): string | null => sessionStorage.getItem(ADMIN_NAME_KEY),
  clearTokens: () => {
    sessionStorage.removeItem(ADMIN_ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(ADMIN_REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(ADMIN_USER_ID_KEY);
    sessionStorage.removeItem(ADMIN_EMAIL_KEY);
    sessionStorage.removeItem(ADMIN_NAME_KEY);
  },
};
