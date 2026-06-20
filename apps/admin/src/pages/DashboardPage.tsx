import { useEffect, useState } from 'react';
import { reportsApi, vehiclesApi, driversApi } from '../lib/api';
import { formatCurrency } from '../lib/utils';

interface MonthlySummary {
  totals: {
    revenue: number;
    ownerShare: number;
    expenses: number;
    hgs: number;
    netProfit: number;
  };
  vehicles: unknown[];
}

export function DashboardPage() {
  const now = new Date();
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [vehicleCount, setVehicleCount] = useState(0);
  const [driverCount, setDriverCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      reportsApi.monthly(now.getFullYear(), now.getMonth() + 1),
      vehiclesApi.list(),
      driversApi.list(),
    ])
      .then(([reportRes, vehiclesRes, driversRes]) => {
        setSummary(reportRes.data);
        setVehicleCount(vehiclesRes.data.meta?.total ?? vehiclesRes.data.data?.length ?? vehiclesRes.data.length ?? 0);
        setDriverCount(driversRes.data.length);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const month = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const stats = [
    { label: 'Active Vehicles', value: vehicleCount, icon: '🚕', color: 'bg-blue-50 text-blue-700' },
    { label: 'Registered Drivers', value: driverCount, icon: '👤', color: 'bg-purple-50 text-purple-700' },
    {
      label: 'Monthly Revenue',
      value: formatCurrency(summary?.totals.revenue ?? 0),
      icon: '💰',
      color: 'bg-green-50 text-green-700',
    },
    {
      label: 'Net Owner Profit',
      value: formatCurrency(summary?.totals.netProfit ?? 0),
      icon: '📈',
      color: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: 'Total Expenses',
      value: formatCurrency(summary?.totals.expenses ?? 0),
      icon: '📋',
      color: 'bg-orange-50 text-orange-700',
    },
    {
      label: 'HGS Tolls',
      value: formatCurrency(summary?.totals.hgs ?? 0),
      icon: '🛣️',
      color: 'bg-red-50 text-red-700',
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Summary for {month}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500">{stat.label}</span>
              <span className={`text-2xl`}>{stat.icon}</span>
            </div>
            <div className={`text-2xl font-bold ${stat.color.split(' ')[1]}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Financial Breakdown ({month})</h2>
        <div className="space-y-3">
          {[
            { label: 'Total Revenue', value: summary?.totals.revenue ?? 0, color: 'text-green-600' },
            { label: 'Owner Share', value: summary?.totals.ownerShare ?? 0, color: 'text-blue-600' },
            { label: 'Vehicle Expenses', value: -(summary?.totals.expenses ?? 0), color: 'text-red-600' },
            { label: 'HGS Tolls', value: -(summary?.totals.hgs ?? 0), color: 'text-orange-600' },
            { label: 'Net Profit', value: summary?.totals.netProfit ?? 0, color: 'text-emerald-600 font-bold' },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <span className="text-sm text-gray-600">{row.label}</span>
              <span className={`text-sm ${row.color}`}>{formatCurrency(row.value)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
