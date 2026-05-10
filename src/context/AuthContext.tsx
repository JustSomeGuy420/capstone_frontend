import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import type { AuthContextValue, SignUpPayload } from '../types/auth';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(Boolean(user));
      setUserName(user?.displayName ?? null);
      setUserEmail(user?.email ?? null);
      setIsEmailVerified(Boolean(user?.emailVerified));
      setPendingEmail(user?.email && !user?.emailVerified ? user.email : null);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUp = useCallback(async ({ fullName, email, password, role, company }: SignUpPayload) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const displayName = role === 'employer' && company ? `${fullName} · ${company}` : fullName;
    await updateProfile(credential.user, { displayName });
    await sendEmailVerification(credential.user, {
      url: `${import.meta.env.VITE_APP_URL ?? 'http://localhost:5173'}/sign-in`,
      handleCodeInApp: false,
    });
    setPendingEmail(email);
    await signOut(auth);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    await credential.user.reload();
    if (!credential.user.emailVerified) {
      setPendingEmail(email);
      await sendEmailVerification(credential.user, {
        url: `${import.meta.env.VITE_APP_URL ?? 'http://localhost:5173'}/sign-in`,
        handleCodeInApp: false,
      });
      throw new Error('Please verify your email before signing in. We sent a fresh verification link.');
    }
  }, []);

  const resendVerification = useCallback(async () => {
    if (!auth.currentUser) {
      throw new Error('Sign in first to resend verification.');
    }
    await sendEmailVerification(auth.currentUser, {
      url: `${import.meta.env.VITE_APP_URL ?? 'http://localhost:5173'}/sign-in`,
      handleCodeInApp: false,
    });
    setPendingEmail(auth.currentUser.email);
  }, []);

  const refreshVerification = useCallback(async () => {
    if (!auth.currentUser) return;
    await auth.currentUser.reload();
    setIsEmailVerified(Boolean(auth.currentUser.emailVerified));
  }, []);

  const signOutUser = useCallback(async () => {
    await signOut(auth);
    setPendingEmail(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      userName,
      userEmail,
      isAuthenticated,
      isEmailVerified,
      isLoading,
      pendingEmail,
      signUp,
      signIn,
      resendVerification,
      refreshVerification,
      signOutUser,
    }),
    [
      userName,
      userEmail,
      isAuthenticated,
      isEmailVerified,
      isLoading,
      pendingEmail,
      signUp,
      signIn,
      resendVerification,
      refreshVerification,
      signOutUser,
    ]
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
