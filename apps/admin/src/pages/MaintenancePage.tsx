import { useEffect, useState } from 'react';
import { maintenanceApi } from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';

interface MaintenanceRecord {
  id: string;
  description: string;
  cost: string;
  date: string;
  mileage?: number;
  serviceProvider?: string;
  vehicle: { plate: string; brand: string; model: string };
}

export function MaintenancePage() {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    maintenanceApi.list().then(({ data }) => setRecords(data)).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Maintenance Records</h1>
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
                {['Date', 'Vehicle', 'Description', 'Service Provider', 'Mileage', 'Cost'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{formatDate(r.date)}</td>
                  <td className="px-4 py-3 font-mono">{r.vehicle.plate}</td>
                  <td className="px-4 py-3">{r.description}</td>
                  <td className="px-4 py-3 text-gray-500">{r.serviceProvider || '—'}</td>
                  <td className="px-4 py-3">{r.mileage ? `${r.mileage.toLocaleString()} km` : '—'}</td>
                  <td className="px-4 py-3 font-medium text-orange-600">{formatCurrency(Number(r.cost))}</td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">No maintenance records yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
