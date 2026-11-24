import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageLoader } from '../components/common/Feedback';
import { roleHome } from '../utils/format';

/** Requires a logged-in user, optionally restricted to specific roles. */
export function ProtectedRoute({ roles, children }) {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return <PageLoader fullscreen label="Opening the vault…" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return children || <Outlet />;
}

/** Pages only for guests (login / register): signed-in users go to their dashboard. */
export function GuestRoute({ children }) {
  const { user, initializing } = useAuth();
  if (initializing) return <PageLoader fullscreen label="Opening the vault…" />;
  if (user) return <Navigate to={roleHome(user.role)} replace />;
  return children || <Outlet />;
}
