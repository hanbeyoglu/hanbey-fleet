import { useEffect, useState } from 'react';
import { reportsApi } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { asArray, MonthlyReportSummary, MonthlyReportVehicleSummary } from '../types/api';

export function ReportsPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [summary, setSummary] = useState<MonthlyReportSummary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    reportsApi
      .monthly(year, month)
      .then(({ data }) => setSummary((data as MonthlyReportSummary) ?? null))
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, [year, month]);

  const MONTHS = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  const totals = summary?.totals;
  const vehicles = asArray<MonthlyReportVehicleSummary>(summary?.vehicles);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Monthly Reports</h1>
        <div className="flex items-center gap-3">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            {[2023, 2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : !summary ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-sm">
          Report data could not be loaded.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Expenses', value: totals?.expenses, color: 'text-red-600' },
              { label: 'HGS Tolls', value: totals?.hgs, color: 'text-orange-600' },
              { label: 'Maintenance', value: totals?.maintenance, color: 'text-emerald-600' },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="text-xs text-gray-500 mb-1">{s.label}</div>
                <div className={`text-lg font-bold ${s.color}`}>{formatCurrency(s.value)}</div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Per-Vehicle Breakdown</h2>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Vehicle', 'Expenses', 'HGS', 'Maintenance'].map((h) => (
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
                {vehicles.map((v) => (
                  <tr key={v.vehicle?.id ?? v.vehicle?.plate} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-mono font-medium">{v.vehicle?.plate ?? '—'}</div>
                      <div className="text-xs text-gray-400">
                        {[v.vehicle?.brand, v.vehicle?.model].filter(Boolean).join(' ') || '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-red-600">
                      {formatCurrency(v.expenses?.total)}
                    </td>
                    <td className="px-4 py-3 text-orange-600">
                      {formatCurrency(v.hgs?.total)}
                    </td>
                    <td className="px-4 py-3 text-emerald-600">
                      {formatCurrency(v.maintenance?.total)}
                    </td>
                  </tr>
                ))}
                {vehicles.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                      No data for this period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
