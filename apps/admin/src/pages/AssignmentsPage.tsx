import { useEffect, useState, useCallback } from 'react';
import { vehicleAssignmentsApi, vehiclesApi, driversApi } from '../lib/api';
import { VehicleAssignmentResponseDto, VehicleResponseDto, DriverResponseDto } from '../types/api';
import { PaginatedResponse } from '@hanbey-fleet/shared';

type Tab = 'current' | 'history';

function StatusBadge({ status }: { status: string }) {
  const classes =
    status === 'ACTIVE'
      ? 'bg-green-100 text-green-800'
      : 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${classes}`}>
      {status}
    </span>
  );
}

function AssignModal({
  vehicles,
  drivers,
  onClose,
  onSuccess,
}: {
  vehicles: VehicleResponseDto[];
  drivers: DriverResponseDto[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId || !driverId) {
      setError('Vehicle and driver are required.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await vehicleAssignmentsApi.assign({ vehicleId, driverId, notes: notes || undefined });
      onSuccess();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Assignment failed.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Assign Vehicle to Driver</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle</label>
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              <option value="">Select vehicle...</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plate} — {v.brand} {v.model}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Driver</label>
            <select
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              <option value="">Select driver...</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.user.name} ({d.user.username})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Optional notes about this assignment..."
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Assigning...' : 'Assign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ReleaseModal({
  assignment,
  onClose,
  onSuccess,
}: {
  assignment: VehicleAssignmentResponseDto;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await vehicleAssignmentsApi.release(assignment.id, { reason: reason || undefined });
      onSuccess();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Release failed.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
    }
  };

  const vehiclePlate = assignment.vehicle?.plate ?? assignment.vehicleId;
  const driverName = assignment.driver?.name ?? assignment.driverId;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Release Assignment</h2>
        <p className="text-sm text-gray-500 mb-4">
          Release {vehiclePlate} from {driverName}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason (optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Reason for releasing this assignment..."
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Releasing...' : 'Release'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AssignmentsPage() {
  const [tab, setTab] = useState<Tab>('current');
  const [assignments, setAssignments] = useState<VehicleAssignmentResponseDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [filterVehicleId, setFilterVehicleId] = useState('');
  const [filterDriverId, setFilterDriverId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [vehicles, setVehicles] = useState<VehicleResponseDto[]>([]);
  const [drivers, setDrivers] = useState<DriverResponseDto[]>([]);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [releaseTarget, setReleaseTarget] = useState<VehicleAssignmentResponseDto | null>(null);

  const limit = 20;

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'history') {
        const res = await vehicleAssignmentsApi.history({ page, limit });
        const body = res.data as PaginatedResponse<VehicleAssignmentResponseDto>;
        setAssignments(body.data);
        setTotal(body.meta.total);
      } else {
        const params: Record<string, unknown> = { page, limit };
        if (filterVehicleId) params.vehicleId = filterVehicleId;
        if (filterDriverId) params.driverId = filterDriverId;
        if (filterStatus) params.status = filterStatus;
        const res = await vehicleAssignmentsApi.list(params);
        const body = res.data as PaginatedResponse<VehicleAssignmentResponseDto>;
        setAssignments(body.data);
        setTotal(body.meta.total);
      }
    } catch {
      setAssignments([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [tab, page, filterVehicleId, filterDriverId, filterStatus]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  useEffect(() => {
    Promise.all([vehiclesApi.list(), driversApi.list()]).then(([vRes, dRes]) => {
      setVehicles(
        (Array.isArray(vRes.data) ? vRes.data : vRes.data?.data ?? []) as VehicleResponseDto[],
      );
      setDrivers(
        (Array.isArray(dRes.data) ? dRes.data : dRes.data?.data ?? []) as DriverResponseDto[],
      );
    });
  }, []);

  const totalPages = Math.ceil(total / limit);

  const handleTabChange = (newTab: Tab) => {
    setTab(newTab);
    setPage(1);
  };

  const handleAssignSuccess = () => {
    setShowAssignModal(false);
    fetchAssignments();
  };

  const handleReleaseSuccess = () => {
    setReleaseTarget(null);
    fetchAssignments();
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vehicle Assignments</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage which driver is responsible for each vehicle
          </p>
        </div>
        <button
          onClick={() => setShowAssignModal(true)}
          className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:opacity-90"
        >
          + Assign Vehicle
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {(['current', 'history'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => handleTabChange(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              tab === t
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'current' ? 'Current Assignments' : 'History'}
          </button>
        ))}
      </div>

      {/* Filters — only on current tab */}
      {tab === 'current' && (
        <div className="flex flex-wrap gap-3 mb-4">
          <select
            value={filterVehicleId}
            onChange={(e) => { setFilterVehicleId(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
          >
            <option value="">All vehicles</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.plate}
              </option>
            ))}
          </select>
          <select
            value={filterDriverId}
            onChange={(e) => { setFilterDriverId(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
          >
            <option value="">All drivers</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.user.name}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="RELEASED">Released</option>
          </select>
          {(filterVehicleId || filterDriverId || filterStatus) && (
            <button
              onClick={() => { setFilterVehicleId(''); setFilterDriverId(''); setFilterStatus(''); setPage(1); }}
              className="text-sm text-gray-500 hover:text-gray-800 underline"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : assignments.length === 0 ? (
          <div className="text-center text-sm text-gray-400 py-16">No assignments found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Vehicle', 'Driver', 'Assigned By', 'Assigned At', 'Released At', 'Reason', 'Status', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {assignments.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium">
                    {a.vehicle ? `${a.vehicle.plate} — ${a.vehicle.brand} ${a.vehicle.model}` : a.vehicleId.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3">
                    {a.driver ? `${a.driver.name} (${a.driver.username})` : a.driverId.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {a.assignedBy?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(a.assignedAt)}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(a.releasedAt)}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">
                    {a.releaseReason ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={a.status} />
                  </td>
                  <td className="px-4 py-3">
                    {a.status === 'ACTIVE' && (
                      <button
                        onClick={() => setReleaseTarget(a)}
                        className="text-xs text-red-600 hover:text-red-800 font-medium"
                      >
                        Release
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-gray-500">
            {total} total &bull; Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {showAssignModal && (
        <AssignModal
          vehicles={vehicles}
          drivers={drivers}
          onClose={() => setShowAssignModal(false)}
          onSuccess={handleAssignSuccess}
        />
      )}

      {releaseTarget && (
        <ReleaseModal
          assignment={releaseTarget}
          onClose={() => setReleaseTarget(null)}
          onSuccess={handleReleaseSuccess}
        />
      )}
    </div>
  );
}
