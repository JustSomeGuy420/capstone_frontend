import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthCard } from '../components/AuthCard';
import { useAuth } from '../context/AuthContext';

export default function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await signIn(email, password);
      const next = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/app';
      navigate(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard title="Welcome back" subtitle="Sign in only after you have clicked the verification link Firebase sent to your email.">
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Email address
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <button className="button primary full" disabled={isSubmitting}>{isSubmitting ? 'Signing in...' : 'Sign in'}</button>
        <p className="muted small center">Need an account? <Link to="/sign-up">Create one</Link></p>
      </form>
    </AuthCard>
  );
}
