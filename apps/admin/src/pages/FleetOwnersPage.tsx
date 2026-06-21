import { useCallback, useEffect, useState } from 'react';
import { fleetOwnersApi } from '../lib/api';

interface FleetOwner {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  taxNumber: string | null;
  vehicleCount: number;
  memberCount: number;
  createdAt: string;
}

interface FormState {
  name: string;
  phone: string;
  email: string;
  address: string;
  taxNumber: string;
}

const EMPTY_FORM: FormState = { name: '', phone: '', email: '', address: '', taxNumber: '' };

export function FleetOwnersPage() {
  const [owners, setOwners] = useState<FleetOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fleetOwnersApi
      .list()
      .then(({ data }) => setOwners(Array.isArray(data) ? data : []))
      .catch(() => setError('Failed to load fleet owners'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (owner: FleetOwner) => {
    setEditingId(owner.id);
    setForm({
      name: owner.name,
      phone: owner.phone,
      email: owner.email ?? '',
      address: owner.address ?? '',
      taxNumber: owner.taxNumber ?? '',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      alert('Name and phone are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        phone: form.phone,
        email: form.email || undefined,
        address: form.address || undefined,
        taxNumber: form.taxNumber || undefined,
      };
      if (editingId) {
        await fleetOwnersApi.update(editingId, payload);
      } else {
        await fleetOwnersApi.create(payload);
      }
      setShowForm(false);
      load();
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete fleet owner "${name}"?`)) return;
    try {
      await fleetOwnersApi.delete(id);
      load();
    } catch {
      alert('Delete failed');
    }
  };

  if (loading) return <div className="p-8 text-gray-500">Loading fleet owners...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fleet Owners</h1>
          <p className="text-sm text-gray-500 mt-1">Manage fleet owner organizations</p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-primary text-white text-sm rounded-md hover:bg-primary/90 transition-colors"
        >
          + New Fleet Owner
        </button>
      </div>

      {owners.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          No fleet owners yet. Create one to get started.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {owners.map((owner) => (
            <div key={owner.id} className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{owner.name}</h3>
                  <p className="text-sm text-gray-500">{owner.phone}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(owner)}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(owner.id, owner.name)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
              {owner.email && <p className="text-xs text-gray-400 mb-1">{owner.email}</p>}
              {owner.address && <p className="text-xs text-gray-400 mb-3">{owner.address}</p>}
              <div className="flex gap-4 text-xs text-gray-500 border-t border-gray-100 pt-3 mt-3">
                <span>{owner.vehicleCount} vehicles</span>
                <span>{owner.memberCount} members</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold">
                {editingId ? 'Edit Fleet Owner' : 'New Fleet Owner'}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Fleet company name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+90 555 001 0001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="info@fleet.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="City, District"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tax Number</label>
                <input
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={form.taxNumber}
                  onChange={(e) => setForm({ ...form, taxNumber: e.target.value })}
                  placeholder="1234567890"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-primary text-white text-sm rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
