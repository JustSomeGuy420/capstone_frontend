export type SignUpPayload = {
  fullName: string;
  email: string;
  password: string;
  role: 'candidate' | 'employer';
  company?: string;
};

export type AuthContextValue = {
  userName: string | null;
  userEmail: string | null;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  isLoading: boolean;
  pendingEmail: string | null;
  signUp: (payload: SignUpPayload) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  refreshVerification: () => Promise<void>;
  signOutUser: () => Promise<void>;
};
