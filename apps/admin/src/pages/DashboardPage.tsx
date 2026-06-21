import { useEffect, useState } from 'react';
import { dashboardApi } from '../lib/api';
import { TimelineFeed } from '../components/TimelineFeed';
import { formatCurrency } from '../lib/utils';
import { DashboardChartDto, DashboardOverviewDto, TimelineEventDto } from '../types/api';

function MiniChart({
  title,
  data,
  color,
}: {
  title: string;
  data: { date: string; value: number }[];
  color: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const recent = data.slice(-14);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
      {recent.every((d) => d.value === 0) ? (
        <p className="text-sm text-gray-400 text-center py-8">No data for this period.</p>
      ) : (
        <div className="flex items-end gap-1 h-32">
          {recent.map((point) => (
            <div key={point.date} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`w-full rounded-t ${color}`}
                style={{ height: `${Math.max((point.value / max) * 100, point.value > 0 ? 4 : 0)}%` }}
                title={`${point.date}: ${formatCurrency(point.value)}`}
              />
              <span className="text-[9px] text-gray-400 rotate-0 truncate w-full text-center">
                {point.date.slice(5)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function DashboardPage() {
  const [overview, setOverview] = useState<DashboardOverviewDto | null>(null);
  const [charts, setCharts] = useState<DashboardChartDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([dashboardApi.overview(), dashboardApi.charts()])
      .then(([overviewRes, chartsRes]) => {
        setOverview(overviewRes.data as DashboardOverviewDto);
        setCharts(chartsRes.data as DashboardChartDto);
      })
      .catch(() => {
        setOverview(null);
        setCharts(null);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const today = overview?.financialSummary.today;
  const settlements = overview?.financialSummary.settlements;
  const fleet = overview?.fleet;

  const timelineEvents: TimelineEventDto[] =
    overview?.timeline.events.map((event) => ({
      id: event.id,
      eventType: event.eventType,
      description: event.description,
      eventTime: event.eventTime,
      vehicleId: event.vehicleId ?? '',
      vehicle: event.vehiclePlate ? { id: event.vehicleId ?? '', plate: event.vehiclePlate } : undefined,
    })) ?? [];

  const assignments = overview?.assignments;

  const stats = [
    { label: "Today's Revenue", value: formatCurrency(today?.revenue), icon: '💰', color: 'text-green-700' },
    { label: "Today's Expenses", value: formatCurrency(today?.expenses), icon: '📋', color: 'text-red-700' },
    { label: "Today's HGS", value: formatCurrency(today?.hgs), icon: '🛣️', color: 'text-orange-700' },
    { label: 'Net Revenue', value: formatCurrency(today?.netRevenue), icon: '📈', color: 'text-emerald-700' },
    { label: 'Active Vehicles', value: fleet?.activeVehicles ?? 0, icon: '🚕', color: 'text-blue-700' },
    { label: 'Active Drivers', value: fleet?.activeDrivers ?? 0, icon: '👤', color: 'text-purple-700' },
    { label: 'Completed Shifts', value: today?.completedShifts ?? 0, icon: '✅', color: 'text-teal-700' },
    { label: 'Maintenance Today', value: today?.maintenanceCount ?? 0, icon: '🔧', color: 'text-yellow-700' },
  ];

  const assignmentStats = [
    { label: 'Assigned Vehicles', value: assignments?.assignedVehicles ?? 0, color: 'text-blue-700 bg-blue-50' },
    { label: 'Unassigned Vehicles', value: assignments?.unassignedVehicles ?? 0, color: 'text-gray-600 bg-gray-50' },
    { label: 'Assigned Drivers', value: assignments?.assignedDrivers ?? 0, color: 'text-indigo-700 bg-indigo-50' },
    { label: 'Available Drivers', value: assignments?.availableDrivers ?? 0, color: 'text-green-700 bg-green-50' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Operational overview for {overview?.date ?? 'today'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">{stat.label}</span>
              <span className="text-xl">{stat.icon}</span>
            </div>
            <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Assignment Overview</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {assignmentStats.map((stat) => (
            <div key={stat.label} className={`rounded-lg p-4 text-center ${stat.color}`}>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Settlement Summary</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Matched', value: settlements?.matched ?? 0, color: 'text-green-700 bg-green-50' },
            { label: 'Mismatch', value: settlements?.mismatch ?? 0, color: 'text-red-700 bg-red-50' },
            { label: 'Approved', value: settlements?.approved ?? 0, color: 'text-blue-700 bg-blue-50' },
          ].map((item) => (
            <div key={item.label} className={`rounded-lg p-4 text-center ${item.color}`}>
              <div className="text-2xl font-bold">{item.value}</div>
              <div className="text-sm mt-1">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Document Compliance</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="rounded-lg p-4 text-center text-red-700 bg-red-50">
            <div className="text-2xl font-bold">{overview?.compliance.expiredCount ?? 0}</div>
            <div className="text-sm mt-1">Expired</div>
          </div>
          <div className="rounded-lg p-4 text-center text-amber-800 bg-amber-50">
            <div className="text-2xl font-bold">{overview?.compliance.expiringCount ?? 0}</div>
            <div className="text-sm mt-1">Expiring Soon</div>
          </div>
        </div>
        {(overview?.compliance.expiredDocuments.length ?? 0) > 0 ? (
          <div className="overflow-hidden border border-gray-100 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Document', 'Owner', 'Type', 'Expired'].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {overview?.compliance.expiredDocuments.map((doc) => (
                  <tr key={doc.id}>
                    <td className="px-3 py-2 font-medium">{doc.title}</td>
                    <td className="px-3 py-2">{doc.ownerLabel ?? doc.ownerId.slice(0, 8)}</td>
                    <td className="px-3 py-2">{doc.type}</td>
                    <td className="px-3 py-2 text-red-600">
                      {doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString('tr-TR') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-400">No expired documents.</p>
        )}
      </div>

      {charts && (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <MiniChart title="Revenue (30 days)" data={charts.revenue} color="bg-green-500" />
          <MiniChart title="Expenses (30 days)" data={charts.expenses} color="bg-red-500" />
          <MiniChart title="HGS (30 days)" data={charts.hgs} color="bg-orange-500" />
        </div>
      )}

      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Timeline</h2>
        <TimelineFeed events={timelineEvents} limit={20} />
      </div>
    </div>
  );
}
