import { Navigate, useLocation } from 'react-router-dom';
import { Role } from '@hanbey-fleet/shared';
import { useAuth } from '../contexts/AuthContext';
import { ADMIN_PORTAL_URL } from '../lib/utils';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { profile, isLoading, needsFleetSelection } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!profile) return <Navigate to="/login" replace />;

  if (profile.user.role !== Role.DRIVER) {
    window.location.href = ADMIN_PORTAL_URL;
    return null;
  }

  if (needsFleetSelection && location.pathname !== '/select-fleet') {
    return <Navigate to="/select-fleet" replace />;
  }

  return <>{children}</>;
}
