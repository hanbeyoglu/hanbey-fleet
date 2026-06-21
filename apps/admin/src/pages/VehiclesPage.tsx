import { useCallback, useEffect, useState, Fragment } from 'react';
import { fleetOwnersApi, shiftsApi, vehiclesApi } from '../lib/api';
import { TimelineFeed } from '../components/TimelineFeed';
import { VehicleStatus } from '@hanbey-fleet/shared';
import {
  ActiveShiftSummaryDto,
  asArray,
  ShiftResponseDto,
  unwrapPaginated,
  VehicleDetailResponseDto,
  VehicleResponseDto,
} from '../types/api';
import { formatDateTime } from '../lib/utils';

const STATUS_COLORS: Partial<Record<VehicleStatus, string>> = {
  [VehicleStatus.IDLE]: 'bg-gray-100 text-gray-600',
  [VehicleStatus.ACTIVE_SHIFT]: 'bg-green-100 text-green-700',
  [VehicleStatus.MAINTENANCE]: 'bg-yellow-100 text-yellow-700',
  [VehicleStatus.OUT_OF_SERVICE]: 'bg-red-100 text-red-700',
};

function shiftToActiveSummary(shift: ShiftResponseDto): ActiveShiftSummaryDto {
  return {
    id: shift.id,
    driverName: shift.driver?.name ?? '—',
    driverUsername: shift.driver?.username ?? '—',
    driverEmail: shift.driver?.email,
    plannedStart: shift.plannedStart,
    plannedEnd: shift.plannedEnd,
    actualStart: shift.actualStart,
  };
}

export function VehiclesPage() {
  const [vehicles, setVehicles] = useState<VehicleResponseDto[]>([]);
  const [activeShiftsByVehicle, setActiveShiftsByVehicle] = useState<
    Record<string, ActiveShiftSummaryDto>
  >({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [vehicleDetail, setVehicleDetail] = useState<VehicleDetailResponseDto | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [fleetOwners, setFleetOwners] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({
    plate: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    hgsTag: '',
    dailyFee: '5000',
    fleetOwnerId: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fleetOwnersApi
      .list()
      .then(({ data }) => setFleetOwners(Array.isArray(data) ? data : []))
      .catch(() => setFleetOwners([]));
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([vehiclesApi.list(), shiftsApi.current()])
      .then(([vehiclesRes, shiftsRes]) => {
        const { data } = unwrapPaginated<VehicleResponseDto>(vehiclesRes.data);
        setVehicles(data);

        const shiftMap: Record<string, ActiveShiftSummaryDto> = {};
        for (const shift of asArray<ShiftResponseDto>(shiftsRes.data)) {
          if (shift.vehicleId) {
            shiftMap[shift.vehicleId] = shiftToActiveSummary(shift);
          }
        }
        setActiveShiftsByVehicle(shiftMap);
      })
      .catch(() => {
        setVehicles([]);
        setActiveShiftsByVehicle({});
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleExpand = async (vehicleId: string) => {
    if (expandedId === vehicleId) {
      setExpandedId(null);
      setVehicleDetail(null);
      return;
    }

    setExpandedId(vehicleId);
    setDetailLoading(true);
    setVehicleDetail(null);

    try {
      const { data } = await vehiclesApi.get(vehicleId);
      setVehicleDetail(data as VehicleDetailResponseDto);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await vehiclesApi.create({
        ...form,
        year: Number(form.year),
        dailyFee: Number(form.dailyFee),
      });
      setShowForm(false);
      setForm({
        plate: '',
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        color: '',
        hgsTag: '',
        dailyFee: '5000',
        fleetOwnerId: '',
      });
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to create vehicle');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this vehicle?')) return;
    await vehiclesApi.delete(id);
    if (expandedId === id) {
      setExpandedId(null);
      setVehicleDetail(null);
    }
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Vehicles</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
        >
          + Add Vehicle
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Register New Vehicle</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
            {/* Fleet Owner selector — BR-151 */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Fleet Owner</label>
              <select
                value={form.fleetOwnerId}
                onChange={(e) => setForm((p) => ({ ...p, fleetOwnerId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">— Select fleet owner (optional) —</option>
                {fleetOwners.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>
            {[
              { name: 'plate', label: 'Plate', placeholder: '34 ABC 123' },
              { name: 'brand', label: 'Brand', placeholder: 'Toyota' },
              { name: 'model', label: 'Model', placeholder: 'Corolla' },
              { name: 'year', label: 'Year', placeholder: '2022', type: 'number' },
              { name: 'color', label: 'Color', placeholder: 'White' },
              { name: 'hgsTag', label: 'HGS Tag', placeholder: 'HGS-123456' },
              { name: 'dailyFee', label: 'Daily Fee (₺)', placeholder: '5000', type: 'number' },
            ].map((f) => (
              <div key={f.name}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                <input
                  type={f.type || 'text'}
                  value={(form as unknown as Record<string, string>)[f.name]}
                  onChange={(e) => setForm((p) => ({ ...p, [f.name]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  required={['plate', 'brand', 'model', 'year'].includes(f.name)}
                />
              </div>
            ))}
            {error && <div className="col-span-2 text-sm text-red-600">{error}</div>}
            <div className="col-span-2 flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-blue-600 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Create Vehicle'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {[
                  'Plate',
                  'Brand / Model',
                  'Year',
                  'Daily Fee',
                  'Mileage',
                  'Status',
                  'Active Driver',
                  'Actions',
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {vehicles.map((v) => {
                const activeShift =
                  vehicleDetail?.id === v.id
                    ? vehicleDetail.activeShift
                    : activeShiftsByVehicle[v.id];
                const isExpanded = expandedId === v.id;

                return (
                  <Fragment key={v.id}>
                    <tr
                      key={v.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => toggleExpand(v.id)}
                    >
                      <td className="px-4 py-3 font-mono font-medium">{v.plate ?? '—'}</td>
                      <td className="px-4 py-3">
                        {[v.brand, v.model].filter(Boolean).join(' ') || '—'}
                      </td>
                      <td className="px-4 py-3">{v.year ?? '—'}</td>
                      <td className="px-4 py-3">
                        {v.dailyFee != null
                          ? `${v.dailyFee.toLocaleString('tr-TR')} ₺`
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {v.currentMileage != null
                          ? `${v.currentMileage.toLocaleString('tr-TR')} km`
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[v.status] ?? 'bg-gray-100 text-gray-600'}`}
                        >
                          {v.status ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {activeShift ? (
                          <span>
                            {activeShift.driverName}
                            <span className="text-gray-400 ml-1">(@{activeShift.driverUsername})</span>
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleDelete(v.id)}
                          className="text-red-500 hover:text-red-700 text-xs"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${v.id}-detail`}>
                        <td colSpan={8} className="px-4 py-4 bg-gray-50">
                          {detailLoading ? (
                            <div className="flex justify-center py-6">
                              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            </div>
                          ) : vehicleDetail?.id === v.id ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              <div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                                  Active Shift
                                </h3>
                                {vehicleDetail.activeShift ? (
                                  <dl className="text-sm space-y-1">
                                    <div className="flex gap-2">
                                      <dt className="text-gray-500 w-28">Driver</dt>
                                      <dd>
                                        {vehicleDetail.activeShift.driverName} (@
                                        {vehicleDetail.activeShift.driverUsername})
                                      </dd>
                                    </div>
                                    <div className="flex gap-2">
                                      <dt className="text-gray-500 w-28">Started</dt>
                                      <dd>
                                        {vehicleDetail.activeShift.actualStart
                                          ? formatDateTime(vehicleDetail.activeShift.actualStart)
                                          : formatDateTime(vehicleDetail.activeShift.plannedStart)}
                                      </dd>
                                    </div>
                                    <div className="flex gap-2">
                                      <dt className="text-gray-500 w-28">Planned end</dt>
                                      <dd>
                                        {formatDateTime(vehicleDetail.activeShift.plannedEnd)}
                                      </dd>
                                    </div>
                                  </dl>
                                ) : (
                                  <p className="text-sm text-gray-400">No active shift</p>
                                )}
                              </div>
                              <div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                                  Timeline
                                </h3>
                                <TimelineFeed
                                  events={(vehicleDetail.timelineEvents ?? []).map((e) => ({
                                    ...e,
                                    vehicleId: v.id,
                                    vehicle: { id: v.id, plate: v.plate ?? '—' },
                                  }))}
                                  limit={10}
                                />
                              </div>
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {vehicles.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                    No vehicles registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
