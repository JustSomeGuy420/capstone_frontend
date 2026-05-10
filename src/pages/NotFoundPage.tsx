import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <main className="page-shell">
      <div className="container">
        <section className="panel placeholder-card">
          <span className="eyebrow">404</span>
          <h1>Page not found</h1>
          <p className="muted copy">The page you tried to open is not part of this frontend bundle.</p>
          <Link className="button primary" to="/">Back to home</Link>
        </section>
      </div>
    </main>
  );
}
