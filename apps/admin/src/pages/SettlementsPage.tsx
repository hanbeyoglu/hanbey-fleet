import { useEffect, useState } from 'react';
import { settlementsApi } from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';

interface Settlement {
  id: string;
  date: string;
  totalRevenue: string;
  driverShare: string;
  ownerShare: string;
  shiftType?: string;
  vehicle: { plate: string; brand: string; model: string };
  driver: { user: { name: string } };
}

export function SettlementsPage() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    settlementsApi.list().then(({ data }) => setSettlements(data)).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settlements</h1>
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
                {['Date', 'Vehicle', 'Driver', 'Shift', 'Total Revenue', 'Driver Share', 'Owner Share'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {settlements.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{formatDate(s.date)}</td>
                  <td className="px-4 py-3 font-mono">{s.vehicle.plate}</td>
                  <td className="px-4 py-3">{s.driver.user.name}</td>
                  <td className="px-4 py-3">{s.shiftType || '—'}</td>
                  <td className="px-4 py-3 font-medium text-green-600">{formatCurrency(Number(s.totalRevenue))}</td>
                  <td className="px-4 py-3">{formatCurrency(Number(s.driverShare))}</td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(Number(s.ownerShare))}</td>
                </tr>
              ))}
              {settlements.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">No settlements recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
