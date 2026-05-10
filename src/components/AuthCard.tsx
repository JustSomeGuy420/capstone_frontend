export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="auth-wrap page-shell">
      <div className="auth-card panel">
        <span className="eyebrow">Secure account access</span>
        <h1>{title}</h1>
        <p className="muted copy">{subtitle}</p>
        {children}
      </div>
    </section>
  );
}
