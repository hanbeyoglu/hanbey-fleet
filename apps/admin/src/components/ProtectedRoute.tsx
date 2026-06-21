import { Navigate, useLocation } from 'react-router-dom';
import { Role } from '@hanbey-fleet/shared';
import { useAuth } from '../contexts/AuthContext';
import { redirectDriverToPortal } from '../lib/portal-urls';

const ADMIN_ROLES: string[] = [Role.SUPER_ADMIN, Role.OWNER, Role.MANAGER, Role.ACCOUNTANT];

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, needsFleetSelection } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (user.role === Role.DRIVER) {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    if (accessToken && refreshToken) {
      redirectDriverToPortal(accessToken, refreshToken);
    } else {
      localStorage.clear();
    }
    return (
      <div className="flex h-screen items-center justify-center p-6 text-center text-sm text-blue-700">
        Şoför hesabı ile admin paneline erişemezsiniz. Şoför paneline yönlendiriliyorsunuz...
      </div>
    );
  }

  if (!ADMIN_ROLES.includes(user.role)) {
    localStorage.clear();
    return <Navigate to="/login" replace />;
  }

  if (needsFleetSelection && location.pathname !== '/select-fleet') {
    return <Navigate to="/select-fleet" replace />;
  }

  return <>{children}</>;
}
