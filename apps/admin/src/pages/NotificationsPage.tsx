import { useCallback, useEffect, useState } from 'react';
import { notificationsApi } from '../lib/api';
import { formatDateTime } from '../lib/utils';
import { NotificationResponseDto, unwrapPaginated } from '../types/api';
import { NotificationType } from '@hanbey-fleet/shared';

const TYPE_LABELS: Record<string, string> = {
  [NotificationType.INFO]: 'Info',
  [NotificationType.WARNING]: 'Warning',
  [NotificationType.ERROR]: 'Error',
  [NotificationType.SUCCESS]: 'Success',
  [NotificationType.MAINTENANCE_REMINDER]: 'Maintenance',
  [NotificationType.WARRANTY_REMINDER]: 'Warranty',
  [NotificationType.SETTLEMENT_MISMATCH]: 'Settlement',
  [NotificationType.DRIVER_REPORT_MISSING]: 'Driver Report',
};

const TYPE_COLORS: Record<string, string> = {
  [NotificationType.MAINTENANCE_REMINDER]: 'bg-amber-100 text-amber-800',
  [NotificationType.WARRANTY_REMINDER]: 'bg-orange-100 text-orange-800',
  [NotificationType.SETTLEMENT_MISMATCH]: 'bg-red-100 text-red-800',
  [NotificationType.DRIVER_REPORT_MISSING]: 'bg-purple-100 text-purple-800',
  [NotificationType.WARNING]: 'bg-yellow-100 text-yellow-800',
  [NotificationType.ERROR]: 'bg-red-100 text-red-800',
  [NotificationType.SUCCESS]: 'bg-green-100 text-green-800',
  [NotificationType.INFO]: 'bg-blue-100 text-blue-800',
};

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterRead, setFilterRead] = useState<'all' | 'unread' | 'read'>('all');
  const [filterType, setFilterType] = useState<string>('');
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const loadNotifications = useCallback(() => {
    setLoading(true);
    const params: Record<string, unknown> = { page, limit: 20 };
    if (filterRead === 'unread') params.isRead = false;
    if (filterRead === 'read') params.isRead = true;
    if (filterType) params.type = filterType;

    notificationsApi
      .list(params)
      .then(({ data }) => {
        const { data: items, meta } = unwrapPaginated<NotificationResponseDto>(data);
        setNotifications(items);
        setTotalPages(meta?.totalPages ?? 1);
      })
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, [page, filterRead, filterType]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkRead = async (id: string) => {
    setMarkingId(id);
    try {
      await notificationsApi.markRead(id);
      loadNotifications();
    } finally {
      setMarkingId(null);
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await notificationsApi.markAllRead();
      loadNotifications();
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">
            System alerts and reminders requiring your attention
          </p>
        </div>
        <button
          type="button"
          onClick={handleMarkAllRead}
          disabled={markingAll}
          className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50"
        >
          {markingAll ? 'Marking…' : 'Mark all as read'}
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={filterRead}
          onChange={(e) => {
            setPage(1);
            setFilterRead(e.target.value as 'all' | 'unread' | 'read');
          }}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"
        >
          <option value="all">All</option>
          <option value="unread">Unread only</option>
          <option value="read">Read only</option>
        </select>
        <select
          value={filterType}
          onChange={(e) => {
            setPage(1);
            setFilterType(e.target.value);
          }}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"
        >
          <option value="">All types</option>
          {Object.entries(TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
          No notifications found.
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`bg-white rounded-xl border p-4 flex items-start justify-between gap-4 ${
                n.isRead ? 'border-gray-200' : 'border-primary/30 bg-primary/5'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      TYPE_COLORS[n.type] ?? 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {TYPE_LABELS[n.type] ?? n.type}
                  </span>
                  {!n.isRead && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary text-white">
                      Unread
                    </span>
                  )}
                </div>
                <h3 className={`text-sm font-semibold ${n.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                  {n.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                <p className="text-xs text-gray-400 mt-2">{formatDateTime(n.createdAt)}</p>
              </div>
              {!n.isRead && (
                <button
                  type="button"
                  onClick={() => handleMarkRead(n.id)}
                  disabled={markingId === n.id}
                  className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-primary border border-primary rounded-lg hover:bg-primary/10 disabled:opacity-50"
                >
                  {markingId === n.id ? '…' : 'Mark read'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
