import { useEffect, useState } from 'react';
import { vehiclesApi } from '../lib/api';
import { VehicleStatus } from '@taxiledger/shared';

interface Vehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  color?: string;
  status: VehicleStatus;
  hgsTag?: string;
  assignments: Array<{
    driver: { user: { name: string } };
    isActive: boolean;
  }>;
}

const STATUS_COLORS: Record<VehicleStatus, string> = {
  [VehicleStatus.ACTIVE]: 'bg-green-100 text-green-700',
  [VehicleStatus.INACTIVE]: 'bg-gray-100 text-gray-600',
  [VehicleStatus.MAINTENANCE]: 'bg-yellow-100 text-yellow-700',
};

export function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ plate: '', brand: '', model: '', year: new Date().getFullYear(), color: '', hgsTag: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    vehiclesApi.list().then(({ data }) => setVehicles(data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await vehiclesApi.create({ ...form, year: Number(form.year) });
      setShowForm(false);
      setForm({ plate: '', brand: '', model: '', year: new Date().getFullYear(), color: '', hgsTag: '' });
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
            {[
              { name: 'plate', label: 'Plate', placeholder: '34 ABC 123' },
              { name: 'brand', label: 'Brand', placeholder: 'Toyota' },
              { name: 'model', label: 'Model', placeholder: 'Corolla' },
              { name: 'year', label: 'Year', placeholder: '2022', type: 'number' },
              { name: 'color', label: 'Color', placeholder: 'White' },
              { name: 'hgsTag', label: 'HGS Tag', placeholder: 'HGS-123456' },
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
              <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-blue-600 disabled:opacity-50">
                {saving ? 'Saving...' : 'Create Vehicle'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50">
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
                {['Plate', 'Brand / Model', 'Year', 'Color', 'Status', 'Active Driver', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {vehicles.map((v) => {
                const activeAssignment = v.assignments.find((a) => a.isActive);
                return (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-medium">{v.plate}</td>
                    <td className="px-4 py-3">{v.brand} {v.model}</td>
                    <td className="px-4 py-3">{v.year}</td>
                    <td className="px-4 py-3">{v.color || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[v.status]}`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {activeAssignment ? activeAssignment.driver.user.name : <span className="text-gray-400">Unassigned</span>}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(v.id)}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
              {vehicles.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
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
