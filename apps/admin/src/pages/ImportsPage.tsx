import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { importsApi } from '../lib/api';
import { formatDateTime } from '../lib/utils';
import { ImportResponseDto, unwrapPaginated } from '../types/api';
import { ImportSource, ImportStatus } from '@hanbey-fleet/shared';

const SOURCE_LABELS: Record<ImportSource, string> = {
  [ImportSource.MANUAL]: 'Manual',
  [ImportSource.WHATSAPP]: 'WhatsApp',
  [ImportSource.OCR]: 'OCR',
};

const STATUS_COLORS: Record<ImportStatus, string> = {
  [ImportStatus.PENDING]: 'bg-gray-100 text-gray-700',
  [ImportStatus.PROCESSING]: 'bg-blue-100 text-blue-700',
  [ImportStatus.COMPLETED]: 'bg-green-100 text-green-700',
  [ImportStatus.FAILED]: 'bg-red-100 text-red-700',
};

export function ImportsPage() {
  const [imports, setImports] = useState<ImportResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterSource, setFilterSource] = useState<string>('');
  const [selected, setSelected] = useState<ImportResponseDto | null>(null);

  const loadImports = useCallback(() => {
    setLoading(true);
    const params: Record<string, unknown> = { page, limit: 20 };
    if (filterStatus) params.status = filterStatus;
    if (filterSource) params.source = filterSource;

    importsApi
      .list(params)
      .then(({ data }) => {
        const { data: items, meta } = unwrapPaginated<ImportResponseDto>(data);
        setImports(items);
        setTotalPages(meta?.totalPages ?? 1);
      })
      .catch(() => setImports([]))
      .finally(() => setLoading(false));
  }, [page, filterStatus, filterSource]);

  useEffect(() => {
    loadImports();
  }, [loadImports]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Import History</h1>
          <p className="text-sm text-gray-500 mt-1">
            Driver declaration imports from manual text, OCR and WhatsApp simulations
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={filterStatus}
          onChange={(e) => {
            setPage(1);
            setFilterStatus(e.target.value);
          }}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"
        >
          <option value="">All statuses</option>
          {Object.values(ImportStatus).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={filterSource}
          onChange={(e) => {
            setPage(1);
            setFilterSource(e.target.value);
          }}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"
        >
          <option value="">All sources</option>
          {Object.values(ImportSource).map((s) => (
            <option key={s} value={s}>
              {SOURCE_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : imports.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
          No import jobs found.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Source', 'Status', 'Created', 'Driver Report', 'Error', 'Actions'].map((h) => (
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
              {imports.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {SOURCE_LABELS[job.source as ImportSource] ?? job.source}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[job.status as ImportStatus]}`}
                    >
                      {job.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{formatDateTime(job.createdAt)}</td>
                  <td className="px-4 py-3">
                    {job.driverReportId ? (
                      <span className="font-mono text-xs text-primary">{job.driverReportId.slice(0, 8)}…</span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3 text-red-600 max-w-[200px] truncate">
                    {job.error ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSelected(job)}
                        className="text-primary hover:underline text-xs"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        disabled
                        title="Retry will be available in a future sprint"
                        className="text-gray-400 text-xs cursor-not-allowed"
                      >
                        Retry
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Import Detail</h2>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-sm mb-4">
              <div>
                <dt className="text-gray-500">Source</dt>
                <dd className="font-medium">
                  {SOURCE_LABELS[selected.source as ImportSource] ?? selected.source}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Status</dt>
                <dd>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[selected.status as ImportStatus]}`}
                  >
                    {selected.status}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Created</dt>
                <dd>{formatDateTime(selected.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Driver Report</dt>
                <dd>
                  {selected.driverReportId ? (
                    <Link to="/settlements" className="text-primary hover:underline font-mono text-xs">
                      {selected.driverReportId}
                    </Link>
                  ) : (
                    '—'
                  )}
                </dd>
              </div>
            </dl>

            {selected.error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">
                {selected.error}
              </div>
            )}

            <div className="mb-4">
              <h3 className="text-xs font-medium text-gray-500 uppercase mb-2">Raw Message</h3>
              <pre className="p-3 bg-gray-50 rounded-lg text-xs whitespace-pre-wrap break-words border border-gray-100">
                {selected.rawContent}
              </pre>
            </div>

            {selected.parsedContent && (
              <div>
                <h3 className="text-xs font-medium text-gray-500 uppercase mb-2">Parsed Values</h3>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm space-y-1">
                  {selected.parsedContent.shiftId && (
                    <p>
                      <span className="text-gray-500">Shift:</span>{' '}
                      <span className="font-mono">{selected.parsedContent.shiftId}</span>
                    </p>
                  )}
                  {selected.parsedContent.declaredRevenue !== undefined && (
                    <p>
                      <span className="text-gray-500">Revenue:</span>{' '}
                      {selected.parsedContent.declaredRevenue}
                    </p>
                  )}
                  {selected.parsedContent.declaredHgs !== undefined && (
                    <p>
                      <span className="text-gray-500">HGS:</span> {selected.parsedContent.declaredHgs}
                    </p>
                  )}
                  {selected.parsedContent.declaredTotal !== undefined && (
                    <p>
                      <span className="text-gray-500">Total:</span>{' '}
                      {selected.parsedContent.declaredTotal}
                    </p>
                  )}
                  {selected.parsedContent.notes && (
                    <p>
                      <span className="text-gray-500">Notes:</span> {selected.parsedContent.notes}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                disabled
                title="Retry will be available in a future sprint"
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-400 cursor-not-allowed"
              >
                Retry
              </button>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
