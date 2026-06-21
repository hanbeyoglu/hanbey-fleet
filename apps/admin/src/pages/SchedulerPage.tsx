import { useCallback, useEffect, useState } from 'react';
import { schedulerApi } from '../lib/api';
import { formatDateTime } from '../lib/utils';
import { SchedulerJobDto, SchedulerStatusDto } from '../types/api';
import { SchedulerJobStatus } from '@hanbey-fleet/shared';

const STATUS_COLORS: Record<SchedulerJobStatus, string> = {
  [SchedulerJobStatus.NEVER_RUN]: 'bg-gray-100 text-gray-700',
  [SchedulerJobStatus.RUNNING]: 'bg-blue-100 text-blue-700',
  [SchedulerJobStatus.SUCCESS]: 'bg-green-100 text-green-700',
  [SchedulerJobStatus.FAILED]: 'bg-red-100 text-red-700',
};

export function SchedulerPage() {
  const [status, setStatus] = useState<SchedulerStatusDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningJob, setRunningJob] = useState<string | null>(null);

  const loadStatus = useCallback(() => {
    setLoading(true);
    schedulerApi
      .jobs()
      .then(({ data }) => setStatus(data))
      .catch(() => setStatus(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 30_000);
    return () => clearInterval(interval);
  }, [loadStatus]);

  const handleManualRun = async (job: SchedulerJobDto) => {
    setRunningJob(job.name);
    try {
      await schedulerApi.run(job.name);
      loadStatus();
    } finally {
      setRunningJob(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Scheduler</h1>
          <p className="text-sm text-gray-500 mt-1">
            Automated recurring business operations
          </p>
        </div>
        <button
          type="button"
          onClick={loadStatus}
          className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : !status ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
          Unable to load scheduler status.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 text-sm text-gray-600">
            Scheduler {status.enabled ? 'enabled' : 'disabled'} · {status.jobs.length} jobs
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {[
                  'Job',
                  'Schedule',
                  'Status',
                  'Last Run',
                  'Next Run',
                  'Duration',
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
              {status.jobs.map((job) => (
                <tr key={job.name} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{job.label}</div>
                    <div className="text-xs text-gray-400 font-mono">{job.name}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{job.schedule}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[job.status as SchedulerJobStatus]}`}
                    >
                      {job.status}
                    </span>
                    {job.lastError && (
                      <p className="text-xs text-red-600 mt-1 max-w-[180px] truncate" title={job.lastError}>
                        {job.lastError}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {job.lastRunAt ? formatDateTime(job.lastRunAt) : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {job.nextRunAt ? formatDateTime(job.nextRunAt) : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {job.lastDurationMs != null ? `${job.lastDurationMs} ms` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleManualRun(job)}
                      disabled={runningJob === job.name || job.status === SchedulerJobStatus.RUNNING}
                      className="px-3 py-1.5 text-xs font-medium text-primary border border-primary rounded-lg hover:bg-primary/10 disabled:opacity-50"
                    >
                      {runningJob === job.name ? 'Running…' : 'Run now'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
