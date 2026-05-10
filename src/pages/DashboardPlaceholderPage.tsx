import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function DashboardPlaceholderPage() {
  const { userName, userEmail } = useAuth();

  return (
    <main className="page-shell">
      <div className="container">
        <section className="panel placeholder-card">
          <span className="eyebrow">Signed in</span>
          <h1>{userName ?? ‘Dashboard’}</h1>
          <p className="muted copy">Signed in as {userEmail}. This route is reserved for the dashboard.</p>
          <div className="placeholder-box">
            <h2>Dashboard placeholder</h2>
            <p className="muted copy">The full dashboard will be built here.</p>
          </div>
          <Link className="button primary" to="/logout">Log out</Link>
        </section>
      </div>
    </main>
  );
}
