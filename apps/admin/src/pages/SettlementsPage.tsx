import { useCallback, useEffect, useState } from 'react';
import { settlementsApi } from '../lib/api';
import { formatCurrency, formatDateTime } from '../lib/utils';
import { SettlementResponseDto, unwrapPaginated } from '../types/api';
import { SettlementStatus, Role } from '@hanbey-fleet/shared';
import { useAuth } from '../contexts/AuthContext';

const STATUS_COLORS: Record<SettlementStatus, string> = {
  [SettlementStatus.MATCHED]: 'bg-green-100 text-green-700',
  [SettlementStatus.MISMATCH]: 'bg-red-100 text-red-700',
  [SettlementStatus.APPROVED]: 'bg-blue-100 text-blue-700',
};

export function SettlementsPage() {
  const { user } = useAuth();
  const [settlements, setSettlements] = useState<SettlementResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SettlementResponseDto | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const canApprove = user?.role === Role.OWNER || user?.role === Role.MANAGER || user?.role === Role.SUPER_ADMIN;

  const loadSettlements = useCallback(() => {
    setLoading(true);
    settlementsApi
      .list()
      .then(({ data }) => {
        const { data: items } = unwrapPaginated<SettlementResponseDto>(data);
        setSettlements(items);
      })
      .catch(() => setSettlements([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadSettlements();
  }, [loadSettlements]);

  const handleApprove = async (id: string) => {
    setApprovingId(id);
    try {
      await settlementsApi.approve(id);
      loadSettlements();
      if (selected?.id === id) {
        const { data } = await settlementsApi.get(id);
        setSelected(data);
      }
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settlements</h1>
          <p className="text-sm text-gray-500 mt-1">
            Financial reconciliation of completed shifts
          </p>
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
                {[
                  'Status',
                  'Driver',
                  'Vehicle',
                  'Declared HGS',
                  'Actual HGS',
                  'Difference',
                  'Expenses',
                  'Net Revenue',
                  'Actions',
                ].map((h) => (
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
              {settlements.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[s.status]}`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{s.shift?.driver?.name ?? '—'}</td>
                  <td className="px-4 py-3 font-mono">{s.shift?.vehicle?.plate ?? '—'}</td>
                  <td className="px-4 py-3">{formatCurrency(s.declaredHgs)}</td>
                  <td className="px-4 py-3">{formatCurrency(s.actualHgs)}</td>
                  <td
                    className={`px-4 py-3 font-medium ${s.difference !== 0 ? 'text-red-600' : 'text-green-600'}`}
                  >
                    {formatCurrency(s.difference)}
                  </td>
                  <td className="px-4 py-3">{formatCurrency(s.expenses)}</td>
                  <td className="px-4 py-3 font-medium text-emerald-600">
                    {formatCurrency(s.netRevenue)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSelected(s)}
                        className="text-primary hover:underline text-xs font-medium"
                      >
                        Detail
                      </button>
                      {canApprove && s.status !== SettlementStatus.APPROVED && (
                        <button
                          type="button"
                          disabled={approvingId === s.id}
                          onClick={() => handleApprove(s.id)}
                          className="text-blue-600 hover:underline text-xs font-medium disabled:opacity-50"
                        >
                          {approvingId === s.id ? 'Approving…' : 'Approve'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {settlements.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
                    No settlements yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Settlement Detail</h2>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Status</dt>
                <dd>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[selected.status]}`}
                  >
                    {selected.status}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Driver</dt>
                <dd>{selected.shift?.driver?.name ?? '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Vehicle</dt>
                <dd className="font-mono">{selected.shift?.vehicle?.plate ?? '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Shift End</dt>
                <dd>
                  {selected.shift?.actualEnd
                    ? formatDateTime(selected.shift.actualEnd)
                    : '—'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Declared Revenue</dt>
                <dd>{formatCurrency(selected.declaredRevenue)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Declared HGS</dt>
                <dd>{formatCurrency(selected.declaredHgs)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Actual HGS</dt>
                <dd>{formatCurrency(selected.actualHgs)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Difference</dt>
                <dd className={selected.difference !== 0 ? 'text-red-600' : 'text-green-600'}>
                  {formatCurrency(selected.difference)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Expenses</dt>
                <dd>{formatCurrency(selected.expenses)}</dd>
              </div>
              <div className="flex justify-between border-t pt-3">
                <dt className="text-gray-900 font-medium">Net Revenue</dt>
                <dd className="font-semibold text-emerald-600">
                  {formatCurrency(selected.netRevenue)}
                </dd>
              </div>
              {selected.approvedBy && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Approved By</dt>
                  <dd>{selected.approvedBy.name}</dd>
                </div>
              )}
            </dl>

            {canApprove && selected.status !== SettlementStatus.APPROVED && (
              <button
                type="button"
                disabled={approvingId === selected.id}
                onClick={() => handleApprove(selected.id)}
                className="mt-6 w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
              >
                {approvingId === selected.id ? 'Approving…' : 'Approve Settlement'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
