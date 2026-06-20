import { useEffect, useState } from 'react';
import { driversApi } from '../lib/api';

interface Driver {
  id: string;
  licenseNo: string;
  phone: string;
  address?: string;
  user: { id: string; name: string; email: string };
  assignments: Array<{
    vehicle: { plate: string; brand: string; model: string };
    isActive: boolean;
  }>;
}

export function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    driversApi.list().then(({ data }) => setDrivers(data)).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Drivers</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Name', 'Email', 'License No', 'Phone', 'Current Vehicle'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {drivers.map((d) => {
                const activeVehicle = d.assignments.find((a) => a.isActive);
                return (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{d.user.name}</td>
                    <td className="px-4 py-3 text-gray-500">{d.user.email}</td>
                    <td className="px-4 py-3 font-mono">{d.licenseNo}</td>
                    <td className="px-4 py-3">{d.phone}</td>
                    <td className="px-4 py-3">
                      {activeVehicle ? (
                        <span className="font-mono">{activeVehicle.vehicle.plate} ({activeVehicle.vehicle.brand} {activeVehicle.vehicle.model})</span>
                      ) : (
                        <span className="text-gray-400">Unassigned</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {drivers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    No drivers registered yet.
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
