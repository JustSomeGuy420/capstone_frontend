import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthCard } from '../components/AuthCard';
import { useAuth } from '../context/AuthContext';
import type { AccountType } from '../types/auth';

export default function SignUpPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('applicant');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await signUp({ firstName, lastName, email, password, accountType, companyName });
      navigate('/sign-in');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create account.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard title="Create your account" subtitle="Register to get started with Transparent Match.">
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          First name
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        </label>
        <label>
          Last name
          <input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        </label>
        <label>
          Email address
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <div className="segmented-row">
          <button type="button" className={accountType === 'applicant' ? 'segment active' : 'segment'} onClick={() => setAccountType('applicant')}>Candidate</button>
          <button type="button" className={accountType === 'recruiter' ? 'segment active' : 'segment'} onClick={() => setAccountType('recruiter')}>Employer</button>
        </div>
        {accountType === 'recruiter' ? (
          <label>
            Company name
            <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
          </label>
        ) : null}
        <label>
          Password
          <input type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <button className="button primary full" disabled={isSubmitting}>{isSubmitting ? 'Creating account...' : 'Create account'}</button>
        <p className="muted small center">Already have an account? <Link to="/sign-in">Sign in</Link></p>
      </form>
    </AuthCard>
  );
}
