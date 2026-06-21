import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Clock, FileText, Bell, User, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

const NAV_ITEMS = [
  { to: '/', label: 'Ana Sayfa', icon: Home },
  { to: '/history', label: 'Geçmiş', icon: Clock },
  { to: '/documents', label: 'Belgeler', icon: FileText },
  { to: '/notifications', label: 'Bildirim', icon: Bell },
  { to: '/profile', label: 'Profil', icon: User },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { logout, fleetOwnerName, fleetMemberships, fleetOwnerId } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col bg-gray-50">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary">Hanbey Fleet</p>
            <h1 className="text-lg font-bold text-gray-900">Şoför Paneli</h1>
            {fleetOwnerName && (
              <p className="text-xs text-gray-500">{fleetOwnerName}</p>
            )}
            {fleetMemberships.length > 1 && fleetOwnerId && (
              <button
                type="button"
                onClick={() => navigate('/select-fleet')}
                className="text-xs text-primary hover:underline"
              >
                Filo değiştir
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            aria-label="Çıkış"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 pb-24">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-10 border-t border-gray-200 bg-white">
        <div className="mx-auto flex max-w-lg justify-around px-1 py-2">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-[10px] font-medium',
                  isActive ? 'text-primary' : 'text-gray-500',
                )
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
