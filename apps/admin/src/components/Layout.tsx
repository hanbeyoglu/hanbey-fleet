import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { NotificationBell } from './NotificationBell';
import { Role } from '@hanbey-fleet/shared';

const NAV = [
  { label: 'Dashboard', href: '/', icon: '⊞', roles: null },
  { label: 'Fleet Owners', href: '/fleet-owners', icon: '🏢', roles: [Role.SUPER_ADMIN] },
  { label: 'Vehicles', href: '/vehicles', icon: '🚕', roles: null },
  { label: 'Drivers', href: '/drivers', icon: '👤', roles: null },
  { label: 'Assignments', href: '/assignments', icon: '🔑', roles: null },
  { label: 'Settlements', href: '/settlements', icon: '💰', roles: null },
  { label: 'Expenses', href: '/expenses', icon: '📋', roles: null },
  { label: 'Maintenance', href: '/maintenance', icon: '🔧', roles: null },
  { label: 'HGS Transits', href: '/hgs', icon: '🛣️', roles: null },
  { label: 'Imports', href: '/imports', icon: '📥', roles: null },
  { label: 'Scheduler', href: '/scheduler', icon: '⏱️', roles: [Role.SUPER_ADMIN, Role.OWNER, Role.MANAGER] },
  { label: 'Documents', href: '/documents', icon: '📄', roles: null },
  { label: 'Reports', href: '/reports', icon: '📊', roles: null },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout, fleetMemberships } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const fleetLabel =
    user?.fleetOwnerName ??
    (user?.role === Role.SUPER_ADMIN && !user.fleetOwnerId ? 'Tüm Filolar' : 'Filo seçilmedi');

  const canSwitchFleet =
    user?.role === Role.SUPER_ADMIN || (fleetMemberships?.length ?? 0) > 1;

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <span className="text-xl font-bold text-primary">🚕 TaxiLedger</span>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV.filter((item) => !item.roles || item.roles.includes(user?.role as Role)).map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                location.pathname === item.href
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:bg-gray-100',
              )}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <div className="mb-2 rounded-md bg-gray-50 px-3 py-2">
            <div className="text-xs text-gray-400 uppercase tracking-wide">Aktif Filo</div>
            <div className="text-sm font-medium text-gray-800 truncate">{fleetLabel}</div>
            {canSwitchFleet && (
              <button
                type="button"
                onClick={() => navigate('/select-fleet')}
                className="mt-1 text-xs text-primary hover:underline"
              >
                Filo değiştir
              </button>
            )}
          </div>
          <div className="text-sm text-gray-600 mb-2 truncate">{user?.username}</div>
          <div className="text-xs text-gray-400 mb-3 uppercase tracking-wide">{user?.role}</div>
          <button
            onClick={handleLogout}
            className="w-full text-left text-sm text-red-500 hover:text-red-700 transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 flex-shrink-0 bg-white border-b border-gray-200 flex items-center justify-between px-8 gap-4">
          <div className="text-sm text-gray-600">
            <span className="text-gray-400">Filo:</span>{' '}
            <span className="font-medium text-gray-900">{fleetLabel}</span>
          </div>
          <NotificationBell />
        </header>
        <main className="flex-1 overflow-auto">
          <div className="p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
