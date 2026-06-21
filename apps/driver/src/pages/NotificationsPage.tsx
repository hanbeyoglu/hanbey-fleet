import { useCallback, useEffect, useState } from 'react';
import { driverPortalApi, unwrapPaginated } from '../lib/api';
import { NotificationResponseDto } from '../types/api';
import { formatDateTime } from '../lib/utils';

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    driverPortalApi
      .notifications({ page: 1, limit: 30 })
      .then(({ data }) => {
        const { data: items } = unwrapPaginated<NotificationResponseDto>(data);
        setNotifications(items);
      })
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleMarkRead = async (id: string) => {
    setMarkingId(id);
    try {
      await driverPortalApi.markNotificationRead(id);
      load();
    } finally {
      setMarkingId(null);
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await driverPortalApi.markAllNotificationsRead();
      load();
    } finally {
      setMarkingAll(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Bildirimler</h2>
        {notifications.some((n) => !n.isRead) && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="text-sm font-medium text-primary disabled:opacity-50"
          >
            {markingAll ? '...' : 'Tümünü okundu işaretle'}
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <p className="py-12 text-center text-gray-400">Bildirim yok.</p>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <article
              key={n.id}
              className={`rounded-2xl border p-4 shadow-sm ${
                n.isRead ? 'border-gray-100 bg-white' : 'border-primary/30 bg-blue-50'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-gray-900">{n.title}</h3>
                  <p className="mt-1 text-sm text-gray-600">{n.message}</p>
                  <p className="mt-2 text-xs text-gray-400">{formatDateTime(n.createdAt)}</p>
                </div>
                {!n.isRead && (
                  <button
                    type="button"
                    onClick={() => handleMarkRead(n.id)}
                    disabled={markingId === n.id}
                    className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                  >
                    Okundu
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
