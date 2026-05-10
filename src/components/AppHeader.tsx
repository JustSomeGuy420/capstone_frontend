import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function UserOutlineIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="user-chip-icon-svg"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="8" r="4" />
    </svg>
  );
}

export function AppHeader() {
  const { isAuthenticated, userName } = useAuth();
  const displayName = userName?.trim() || 'Account';

  return (
    <header className="topbar">
      <div className="container topbar-inner">
        <Link to="/" className="brand-mark">Transparent Match</Link>
        <nav className="topnav">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/sign-up">Sign up</NavLink>
          <NavLink to="/sign-in">Sign in</NavLink>
          {isAuthenticated ? <NavLink to="/logout">Logout</NavLink> : null}
        </nav>
        <div className="user-chip" aria-label={isAuthenticated ? `Logged in as ${displayName}` : 'Account menu placeholder'}>
          <span className="user-chip-icon" aria-hidden="true">
            <UserOutlineIcon />
          </span>
          <span className="user-chip-text" title={displayName}>{displayName}</span>
        </div>
      </div>
    </header>
  );
}
