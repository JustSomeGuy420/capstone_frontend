import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LogoutPage() {
  const navigate = useNavigate();
  const { signOutUser } = useAuth();

  useEffect(() => {
    signOutUser().finally(() => navigate('/sign-in', { replace: true }));
  }, [navigate, signOutUser]);

  return (
    <main className="page-shell">
      <div className="container"><div className="panel">Signing you out...</div></div>
    </main>
  );
}
