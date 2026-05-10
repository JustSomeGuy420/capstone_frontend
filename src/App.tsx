import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppHeader } from './components/AppHeader';
import LandingPage from './pages/LandingPage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import DashboardPlaceholderPage from './pages/DashboardPlaceholderPage';
import LogoutPage from './pages/LogoutPage';
import NotFoundPage from './pages/NotFoundPage';

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <div className="app-root">
      <Routes>
        <Route path="/" element={<PublicRoute><AppHeader /><LandingPage /></PublicRoute>} />
        <Route path="/sign-in" element={<PublicRoute><AppHeader /><SignInPage /></PublicRoute>} />
        <Route path="/sign-up" element={<PublicRoute><AppHeader /><SignUpPage /></PublicRoute>} />
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <DashboardPlaceholderPage />
            </ProtectedRoute>
          }
        />
        <Route path="/logout" element={<LogoutPage />} />
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </div>
  );
}
