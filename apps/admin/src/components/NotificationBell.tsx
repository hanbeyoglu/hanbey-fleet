import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { notificationsApi } from '../lib/api';

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);

  const loadCount = useCallback(() => {
    notificationsApi
      .unreadCount()
      .then(({ data }) => setUnreadCount(data.count ?? 0))
      .catch(() => setUnreadCount(0));
  }, []);

  useEffect(() => {
    loadCount();
    const interval = setInterval(loadCount, 60_000);
    return () => clearInterval(interval);
  }, [loadCount]);

  return (
    <Link
      to="/notifications"
      className="relative inline-flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors"
      aria-label="Notifications"
    >
      <span className="text-xl">🔔</span>
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  );
}
