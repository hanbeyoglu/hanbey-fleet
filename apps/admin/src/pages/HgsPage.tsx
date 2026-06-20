import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';

interface HgsTransit {
  id: string;
  transitDate: string;
  location: string;
  amount: string;
  referenceNo?: string;
  vehicle: { plate: string; hgsTag?: string };
}

export function HgsPage() {
  const [transits, setTransits] = useState<HgsTransit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/hgs').then(({ data }) => setTransits(data)).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">HGS Transits</h1>
          <p className="text-sm text-gray-500 mt-1">İş Bankası API integration coming soon</p>
        </div>
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
                {['Date', 'Vehicle', 'HGS Tag', 'Location', 'Reference', 'Amount'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transits.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{formatDate(t.transitDate)}</td>
                  <td className="px-4 py-3 font-mono">{t.vehicle.plate}</td>
                  <td className="px-4 py-3 text-gray-500">{t.vehicle.hgsTag || '—'}</td>
                  <td className="px-4 py-3">{t.location}</td>
                  <td className="px-4 py-3 font-mono text-gray-500">{t.referenceNo || '—'}</td>
                  <td className="px-4 py-3 font-medium text-red-600">{formatCurrency(Number(t.amount))}</td>
                </tr>
              ))}
              {transits.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">No HGS transits recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
