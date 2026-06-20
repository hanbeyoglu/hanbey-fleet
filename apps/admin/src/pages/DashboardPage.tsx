import { useEffect, useState } from 'react';
import { driversApi, reportsApi, shiftsApi, timelineApi, vehiclesApi } from '../lib/api';
import { TimelineFeed } from '../components/TimelineFeed';
import { formatCurrency } from '../lib/utils';
import {
  asArray,
  MonthlyReportSummary,
  ShiftResponseDto,
  TimelineEventDto,
  unwrapPaginated,
} from '../types/api';

export function DashboardPage() {
  const now = new Date();
  const [summary, setSummary] = useState<MonthlyReportSummary | null>(null);
  const [vehicleCount, setVehicleCount] = useState(0);
  const [driverCount, setDriverCount] = useState(0);
  const [activeShiftCount, setActiveShiftCount] = useState(0);
  const [timeline, setTimeline] = useState<TimelineEventDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      reportsApi.monthly(now.getFullYear(), now.getMonth() + 1),
      vehiclesApi.list(),
      driversApi.list(),
      shiftsApi.current(),
      timelineApi.list(),
    ])
      .then(([reportRes, vehiclesRes, driversRes, shiftsRes, timelineRes]) => {
        setSummary((reportRes.data as MonthlyReportSummary) ?? null);

        const { data: vehicles, meta } = unwrapPaginated(vehiclesRes.data);
        setVehicleCount(meta?.total ?? vehicles.length);

        setDriverCount(asArray(driversRes.data).length);
        setActiveShiftCount(asArray<ShiftResponseDto>(shiftsRes.data).length);
        setTimeline(asArray<TimelineEventDto>(timelineRes.data));
      })
      .catch(() => {
        setSummary(null);
        setTimeline([]);
      })
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

  const totals = summary?.totals;

  const stats = [
    { label: 'Registered Vehicles', value: vehicleCount, icon: '🚕', color: 'text-blue-700' },
    { label: 'Registered Drivers', value: driverCount, icon: '👤', color: 'text-purple-700' },
    { label: 'Active Shifts', value: activeShiftCount, icon: '🔄', color: 'text-green-700' },
    {
      label: 'Monthly Expenses',
      value: formatCurrency(totals?.expenses),
      icon: '📋',
      color: 'text-orange-700',
    },
    {
      label: 'HGS Tolls',
      value: formatCurrency(totals?.hgs),
      icon: '🛣️',
      color: 'text-red-700',
    },
    {
      label: 'Maintenance',
      value: formatCurrency(totals?.maintenance),
      icon: '🔧',
      color: 'text-emerald-700',
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
              <span className="text-2xl">{stat.icon}</span>
            </div>
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Cost Breakdown ({month})</h2>
          <div className="space-y-3">
            {[
              { label: 'Vehicle Expenses', value: totals?.expenses, color: 'text-red-600' },
              { label: 'HGS Tolls', value: totals?.hgs, color: 'text-orange-600' },
              { label: 'Maintenance', value: totals?.maintenance, color: 'text-emerald-600' },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <span className="text-sm text-gray-600">{row.label}</span>
                <span className={`text-sm font-medium ${row.color}`}>
                  {formatCurrency(row.value)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Timeline</h2>
          <TimelineFeed events={timeline} limit={8} />
        </div>
      </div>
    </div>
  );
}
