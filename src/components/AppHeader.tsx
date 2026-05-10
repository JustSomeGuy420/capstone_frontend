import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function AppHeader() {
  const { isAuthenticated } = useAuth();

  return (
    <header className="topbar">
      <div className="container topbar-inner">
        <Link to={isAuthenticated ? '/app' : '/'} className="brand-mark">Transparent Match</Link>
        <nav className="topnav">
          {isAuthenticated ? (
            <NavLink to="/logout">Log out</NavLink>
          ) : (
            <>
              <NavLink to="/sign-up">Sign up</NavLink>
              <NavLink to="/sign-in">Sign in</NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
