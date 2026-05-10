import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthCard } from '../components/AuthCard';
import { useAuth } from '../context/AuthContext';

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const { pendingEmail, refreshVerification, resendVerification, isAuthenticated, isEmailVerified } = useAuth();
  const [message, setMessage] = useState('Open your inbox and click the Firebase verification link.');
  const [error, setError] = useState('');

  async function handleRefresh() {
    setError('');
    try {
      await refreshVerification();
      if (isAuthenticated && isEmailVerified) {
        navigate('/app');
        return;
      }
      setMessage('Still waiting for verification. After clicking the email link, try again here.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not refresh verification state.');
    }
  }

  async function handleResend() {
    setError('');
    try {
      await resendVerification();
      setMessage('A fresh verification email was sent.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend verification email.');
    }
  }

  return (
    <AuthCard title="Verify your email" subtitle="Your account stays locked until Firebase confirms the email address belongs to you.">
      <div className="verification-box">
        <p className="copy">Verification target: <strong>{pendingEmail ?? 'Use the same email you registered with.'}</strong></p>
        <p className="muted copy">{message}</p>
        {error ? <p className="form-error">{error}</p> : null}
        <div className="cta-row wrap">
          <button className="button primary" onClick={handleRefresh}>I clicked the link</button>
          <button className="button secondary" onClick={handleResend}>Resend email</button>
        </div>
        <p className="muted small center">Already verified? <Link to="/sign-in">Return to sign in</Link></p>
      </div>
    </AuthCard>
  );
}
