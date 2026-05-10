import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function DashboardPlaceholderPage() {
  const { userName, userEmail } = useAuth();

  return (
    <main className="page-shell">
      <div className="container">
        <section className="panel placeholder-card">
          <span className="eyebrow">Verified and ready</span>
          <h1>{userName ?? 'Account verified'}</h1>
          <p className="muted copy">Signed in as {userEmail}. This route is intentionally reserved for your teammate’s dashboard.</p>
          <div className="placeholder-box">
            <h2>404 / dashboard handoff placeholder</h2>
            <p className="muted copy">Link this route to the shared dashboard once your teammate finishes their page.</p>
          </div>
          <Link className="button primary" to="/logout">Log out</Link>
        </section>
      </div>
    </main>
  );
}
