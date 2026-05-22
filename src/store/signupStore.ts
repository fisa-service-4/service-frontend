interface SignupFormData {
  email: string;
  password: string;
  freelancerYn: boolean;
  jobType: string;
  termsConsentYn: boolean;
  userName: string;
  phoneNumber: string;
  residentNumber: string;
  telecom: string;
}

const KEY = 'signupFormData';

export const signupStore = {
  save: (data: Partial<SignupFormData>) => {
    const existing = signupStore.get();
    sessionStorage.setItem(KEY, JSON.stringify({ ...existing, ...data }));
  },
  get: (): Partial<SignupFormData> => {
    if (typeof window === 'undefined') return {};
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Partial<SignupFormData>) : {};
  },
  clear: () => sessionStorage.removeItem(KEY),
};
