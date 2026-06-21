import { useCallback, useEffect, useState } from 'react';
import { driverPortalApi, unwrapPaginated } from '../lib/api';
import { ShiftResponseDto } from '../types/api';
import { ShiftStatus } from '@hanbey-fleet/shared';
import { formatDateTime } from '../lib/utils';

const STATUS_LABEL: Record<string, string> = {
  [ShiftStatus.ACTIVE]: 'Aktif',
  [ShiftStatus.COMPLETED]: 'Tamamlandı',
  [ShiftStatus.CANCELLED]: 'İptal',
  [ShiftStatus.PLANNED]: 'Planlandı',
};

export function HistoryPage() {
  const [shifts, setShifts] = useState<ShiftResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(() => {
    setLoading(true);
    driverPortalApi
      .shiftHistory({ page, limit: 10 })
      .then(({ data }) => {
        const { data: items, meta } = unwrapPaginated<ShiftResponseDto>(data);
        setShifts(items);
        setTotalPages(meta?.totalPages ?? 1);
      })
      .catch(() => setShifts([]))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && shifts.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Vardiya Geçmişi</h2>

      {shifts.length === 0 ? (
        <p className="text-center text-gray-400 py-12">Henüz vardiya kaydı yok.</p>
      ) : (
        <div className="space-y-3">
          {shifts.map((shift) => (
            <article key={shift.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-mono font-bold text-gray-900">
                    {shift.vehicle?.plate ?? '—'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {shift.vehicle?.brand} {shift.vehicle?.model}
                  </p>
                </div>
                <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                  {STATUS_LABEL[shift.status] ?? shift.status}
                </span>
              </div>
              <dl className="mt-3 space-y-1 text-sm text-gray-600">
                <div className="flex justify-between">
                  <dt>Başlangıç</dt>
                  <dd>{formatDateTime(shift.actualStart ?? shift.plannedStart)}</dd>
                </div>
                {shift.actualEnd && (
                  <div className="flex justify-between">
                    <dt>Bitiş</dt>
                    <dd>{formatDateTime(shift.actualEnd)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt>KM</dt>
                  <dd>
                    {shift.openingMileage.toLocaleString('tr-TR')}
                    {shift.closingMileage != null && ` → ${shift.closingMileage.toLocaleString('tr-TR')}`}
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-3 pt-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40"
          >
            Önceki
          </button>
          <span className="py-2 text-sm text-gray-500">{page} / {totalPages}</span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40"
          >
            Sonraki
          </button>
        </div>
      )}
    </div>
  );
}
