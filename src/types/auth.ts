export type AccountType = 'applicant' | 'recruiter';

export type SignUpPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  accountType: AccountType;
  companyName?: string;
};

export type AuthContextValue = {
  userName: string | null;
  userEmail: string | null;
  accountType: AccountType | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signUp: (payload: SignUpPayload) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;
};
