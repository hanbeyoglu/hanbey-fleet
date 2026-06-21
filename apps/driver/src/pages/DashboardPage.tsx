import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { driverPortalApi } from '../lib/api';
import { DriverPortalOverviewDto } from '../types/api';
import { ShiftStatus } from '@hanbey-fleet/shared';
import { formatDateTime, formatDuration } from '../lib/utils';

export function DashboardPage() {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<DriverPortalOverviewDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());

  const load = useCallback(() => {
    setLoading(true);
    driverPortalApi
      .overview()
      .then(({ data }) => setOverview(data))
      .catch(() => setOverview(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (overview?.activeShift?.status !== ShiftStatus.ACTIVE) return;
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, [overview?.activeShift?.status]);

  const handleStartShift = async () => {
    setStarting(true);
    setError('');
    try {
      await driverPortalApi.startShift();
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Vardiya başlatılamadı.');
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const assignment = overview?.currentAssignment;
  const shift = overview?.activeShift;
  const vehicle = assignment?.vehicle;
  const shiftDuration =
    shift?.actualStart && shift.status === ShiftStatus.ACTIVE
      ? formatDuration(now - new Date(shift.actualStart).getTime())
      : null;

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-gray-500">Bugünkü Araç</p>
        {vehicle ? (
          <>
            <h2 className="mt-1 font-mono text-2xl font-bold text-gray-900">{vehicle.plate}</h2>
            <p className="text-gray-600">
              {vehicle.brand} {vehicle.model}
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Yevmiye: <span className="font-semibold text-gray-800">{vehicle.dailyFee.toLocaleString('tr-TR')} ₺</span>
            </p>
          </>
        ) : (
          <p className="mt-2 text-gray-500">Aktif araç ataması yok.</p>
        )}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-gray-500">Vardiya Durumu</p>
        {shift ? (
          <div className="mt-2 space-y-1">
            <p className="text-lg font-semibold text-gray-900">
              {shift.status === ShiftStatus.ACTIVE ? 'Aktif Vardiya' : shift.status}
            </p>
            {shift.actualStart && (
              <p className="text-sm text-gray-600">Başlangıç: {formatDateTime(shift.actualStart)}</p>
            )}
            {shiftDuration && (
              <p className="text-sm text-primary font-medium">Süre: {shiftDuration}</p>
            )}
            {shift.openingMileage != null && (
              <p className="text-sm text-gray-600">Açılış KM: {shift.openingMileage.toLocaleString('tr-TR')}</p>
            )}
          </div>
        ) : (
          <p className="mt-2 text-gray-500">Aktif vardiya yok.</p>
        )}
      </section>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      {overview?.canStartShift && (
        <button
          type="button"
          onClick={handleStartShift}
          disabled={starting}
          className="w-full rounded-2xl bg-green-600 py-5 text-lg font-bold text-white shadow-lg transition-colors hover:bg-green-700 disabled:opacity-50"
        >
          {starting ? 'Başlatılıyor...' : '🚕 Aracı Teslim Aldım'}
        </button>
      )}

      {overview?.canSubmitEndOfDay && shift && (
        <button
          type="button"
          onClick={() => navigate(`/end-of-day/${shift.id}`)}
          className="w-full rounded-2xl bg-primary py-5 text-lg font-bold text-white shadow-lg transition-colors hover:bg-blue-600"
        >
          Gün Sonunu Tamamla
        </button>
      )}
    </div>
  );
}
