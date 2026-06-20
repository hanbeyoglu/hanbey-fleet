import { TimelineEventDto } from '../types/api';
import { formatDateTime } from '../lib/utils';

interface TimelineFeedProps {
  events?: TimelineEventDto[] | null;
  emptyMessage?: string;
  limit?: number;
}

export function TimelineFeed({
  events,
  emptyMessage = 'No timeline events yet.',
  limit,
}: TimelineFeedProps) {
  const safeEvents = Array.isArray(events) ? events : [];
  const items = limit ? safeEvents.slice(0, limit) : safeEvents;

  if (items.length === 0) {
    return <p className="text-sm text-gray-400 py-4 text-center">{emptyMessage}</p>;
  }

  return (
    <ul className="divide-y divide-gray-100">
      {items.map((event) => (
        <li key={event.id} className="py-3 flex gap-3">
          <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-primary" />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-gray-900">{event.description?.trim() || '—'}</p>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs text-gray-500">
              <span>{formatDateTime(event.eventTime)}</span>
              {event.vehicle?.plate && (
                <>
                  <span>·</span>
                  <span className="font-mono">{event.vehicle.plate}</span>
                </>
              )}
              {event.eventType && (
                <>
                  <span>·</span>
                  <span className="uppercase tracking-wide">
                    {String(event.eventType).replace(/_/g, ' ')}
                  </span>
                </>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
