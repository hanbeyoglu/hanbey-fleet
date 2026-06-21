import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { NotificationBell } from './NotificationBell';

const NAV = [
  { label: 'Dashboard', href: '/', icon: '⊞' },
  { label: 'Vehicles', href: '/vehicles', icon: '🚕' },
  { label: 'Drivers', href: '/drivers', icon: '👤' },
  { label: 'Settlements', href: '/settlements', icon: '💰' },
  { label: 'Expenses', href: '/expenses', icon: '📋' },
  { label: 'Maintenance', href: '/maintenance', icon: '🔧' },
  { label: 'HGS Transits', href: '/hgs', icon: '🛣️' },
  { label: 'Imports', href: '/imports', icon: '📥' },
  { label: 'Scheduler', href: '/scheduler', icon: '⏱️' },
  { label: 'Documents', href: '/documents', icon: '📄' },
  { label: 'Reports', href: '/reports', icon: '📊' },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <span className="text-xl font-bold text-primary">🚕 TaxiLedger</span>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV.map((item) => (
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
        <header className="h-16 flex-shrink-0 bg-white border-b border-gray-200 flex items-center justify-end px-8 gap-4">
          <NotificationBell />
        </header>
        <main className="flex-1 overflow-auto">
          <div className="p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
