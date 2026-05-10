import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthCard } from '../components/AuthCard';
import { useAuth } from '../context/AuthContext';

export default function SignUpPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState<'candidate' | 'employer'>('candidate');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await signUp({ fullName, email, password, role, company });
      navigate('/verify-email');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create account.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard title="Create your account" subtitle="Register with a real email so Firebase can send a verification link before first login.">
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Full name
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </label>
        <label>
          Email address
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <div className="segmented-row">
          <button type="button" className={role === 'candidate' ? 'segment active' : 'segment'} onClick={() => setRole('candidate')}>Candidate</button>
          <button type="button" className={role === 'employer' ? 'segment active' : 'segment'} onClick={() => setRole('employer')}>Employer</button>
        </div>
        {role === 'employer' ? (
          <label>
            Company name
            <input value={company} onChange={(e) => setCompany(e.target.value)} required={role === 'employer'} />
          </label>
        ) : null}
        <label>
          Password
          <input type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <p className="muted small">Use at least 8 characters. Firebase will handle the account and email verification flow.</p>
        {error ? <p className="form-error">{error}</p> : null}
        <button className="button primary full" disabled={isSubmitting}>{isSubmitting ? 'Creating account...' : 'Create account'}</button>
        <p className="muted small center">Already have an account? <Link to="/sign-in">Sign in</Link></p>
      </form>
    </AuthCard>
  );
}
