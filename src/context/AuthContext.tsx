import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { api, setToken, clearToken } from '../lib/api';
import type { AccountType, AuthContextValue, SignUpPayload } from '../types/auth';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type MeResponse = {
  user_id: number;
  f_name: string;
  l_name: string;
  email: string;
  account_type: AccountType;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  function applyUser(me: MeResponse) {
    setUserName(`${me.f_name} ${me.l_name}`);
    setUserEmail(me.email);
    setAccountType(me.account_type);
    setIsAuthenticated(true);
  }

  function clearUser() {
    setUserName(null);
    setUserEmail(null);
    setAccountType(null);
    setIsAuthenticated(false);
  }

  // On mount, rehydrate session from stored token
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    api.get<MeResponse>('/users/me')
      .then(applyUser)
      .catch(() => clearToken())
      .finally(() => setIsLoading(false));
  }, []);

  const signUp = useCallback(async ({ firstName, lastName, email, password, accountType: type, companyName }: SignUpPayload) => {
    await api.post('/auth/register', {
      f_name: firstName,
      l_name: lastName,
      email,
      password,
      account_type: type,
      company_name: companyName,
    });
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { access_token } = await api.post<{ access_token: string; token_type: string }>(
      '/auth/login',
      { email, password }
    );
    setToken(access_token);
    const me = await api.get<MeResponse>('/users/me');
    applyUser(me);
  }, []);

  const signOutUser = useCallback(async () => {
    clearToken();
    clearUser();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      userName,
      userEmail,
      accountType,
      isAuthenticated,
      isLoading,
      signUp,
      signIn,
      signOutUser,
    }),
    [userName, userEmail, accountType, isAuthenticated, isLoading, signUp, signIn, signOutUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
