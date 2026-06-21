import { useCallback, useEffect, useState } from 'react';
import { documentsApi, driversApi, vehiclesApi } from '../lib/api';
import { formatDate, formatDateTime } from '../lib/utils';
import {
  DocumentResponseDto,
  DriverResponseDto,
  VehicleResponseDto,
  unwrapPaginated,
} from '../types/api';
import {
  DocumentStatus,
  DocumentType,
  OwnerType,
  VEHICLE_DOCUMENT_TYPES,
  DRIVER_DOCUMENT_TYPES,
} from '@hanbey-fleet/shared';

const STATUS_COLORS: Record<DocumentStatus, string> = {
  [DocumentStatus.VALID]: 'bg-green-100 text-green-700',
  [DocumentStatus.EXPIRING]: 'bg-amber-100 text-amber-800',
  [DocumentStatus.EXPIRED]: 'bg-red-100 text-red-700',
};

const TYPE_LABELS: Partial<Record<DocumentType, string>> = {
  [DocumentType.VEHICLE_LICENSE]: 'Vehicle License',
  [DocumentType.REGISTRATION]: 'Registration',
  [DocumentType.INSURANCE]: 'Insurance',
  [DocumentType.COMPREHENSIVE_INSURANCE]: 'Comprehensive Insurance',
  [DocumentType.INSPECTION]: 'Inspection',
  [DocumentType.EXHAUST_EMISSION]: 'Exhaust Emission',
  [DocumentType.MUNICIPALITY_PERMIT]: 'Municipality Permit',
  [DocumentType.TAXI_PLATE_PERMIT]: 'Taxi Plate Permit',
  [DocumentType.DRIVER_LICENSE]: 'Driver License',
  [DocumentType.SRC_CERTIFICATE]: 'SRC Certificate',
  [DocumentType.PSYCHOTECHNIC_CERTIFICATE]: 'Psychotechnic Certificate',
  [DocumentType.CRIMINAL_RECORD]: 'Criminal Record',
  [DocumentType.ID_CARD]: 'ID Card',
  [DocumentType.CONTRACT]: 'Contract',
};

type Tab = OwnerType;

const EMPTY_FORM = {
  ownerId: '',
  title: '',
  type: '' as DocumentType | '',
  issueDate: '',
  expiryDate: '',
  fileName: '',
  fileUrl: '',
  mimeType: 'application/pdf',
  size: 0,
};

export function DocumentsPage() {
  const [tab, setTab] = useState<Tab>(OwnerType.VEHICLE);
  const [documents, setDocuments] = useState<DocumentResponseDto[]>([]);
  const [vehicles, setVehicles] = useState<VehicleResponseDto[]>([]);
  const [drivers, setDrivers] = useState<DriverResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selected, setSelected] = useState<DocumentResponseDto | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const allowedTypes = tab === OwnerType.VEHICLE ? VEHICLE_DOCUMENT_TYPES : DRIVER_DOCUMENT_TYPES;

  const loadDocuments = useCallback(() => {
    setLoading(true);
    const params: Record<string, unknown> = { ownerType: tab, limit: 50 };
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    if (typeFilter) params.type = typeFilter;

    documentsApi
      .list(params)
      .then(({ data }) => {
        const { data: items } = unwrapPaginated<DocumentResponseDto>(data);
        setDocuments(items);
      })
      .catch(() => setDocuments([]))
      .finally(() => setLoading(false));
  }, [tab, search, statusFilter, typeFilter]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  useEffect(() => {
    vehiclesApi
      .list({ limit: 100 })
      .then(({ data }) => {
        const { data: items } = unwrapPaginated<VehicleResponseDto>(data);
        setVehicles(items);
      })
      .catch(() => setVehicles([]));

    driversApi
      .list()
      .then(({ data }) => setDrivers(Array.isArray(data) ? data : data.data ?? []))
      .catch(() => setDrivers([]));
  }, []);

  const handleCreate = async () => {
    if (!form.ownerId || !form.type || !form.title || !form.fileName || !form.fileUrl) return;
    setSaving(true);
    try {
      await documentsApi.create({
        ownerType: tab,
        ownerId: form.ownerId,
        title: form.title,
        type: form.type,
        issueDate: form.issueDate || undefined,
        expiryDate: form.expiryDate || undefined,
        fileName: form.fileName,
        fileUrl: form.fileUrl,
        mimeType: form.mimeType,
        size: Number(form.size) || 0,
      });
      setShowCreate(false);
      setForm(EMPTY_FORM);
      loadDocuments();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-sm text-gray-500 mt-1">
            Legal document metadata for vehicles and drivers
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90"
        >
          Add document
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        {[OwnerType.VEHICLE, OwnerType.DRIVER].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`px-4 py-2 text-sm rounded-lg border ${
              tab === value
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {value === OwnerType.VEHICLE ? 'Vehicle Documents' : 'Driver Documents'}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title..."
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white min-w-[200px]"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"
        >
          <option value="">All statuses</option>
          {Object.values(DocumentStatus).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"
        >
          <option value="">All types</option>
          {allowedTypes.map((t) => (
            <option key={t} value={t}>
              {TYPE_LABELS[t] ?? t}
            </option>
          ))}
        </select>
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
                {['Title', 'Type', 'Owner', 'Expiry', 'Status', 'File', 'Actions'].map((h) => (
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
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{doc.title}</td>
                  <td className="px-4 py-3">{TYPE_LABELS[doc.type as DocumentType] ?? doc.type}</td>
                  <td className="px-4 py-3">{doc.ownerLabel ?? doc.ownerId.slice(0, 8)}</td>
                  <td className="px-4 py-3">{doc.expiryDate ? formatDate(doc.expiryDate) : '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[doc.status as DocumentStatus]}`}
                    >
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={doc.currentRevision.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline text-xs"
                    >
                      Download
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setSelected(doc)}
                      className="text-primary hover:underline text-xs"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {documents.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    No documents found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Add {tab} Document</h2>
            <div className="space-y-3">
              <select
                value={form.ownerId}
                onChange={(e) => setForm({ ...form, ownerId: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
              >
                <option value="">Select owner</option>
                {tab === OwnerType.VEHICLE
                  ? vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.plate} — {v.brand} {v.model}
                      </option>
                    ))
                  : drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.user.name}
                      </option>
                    ))}
              </select>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Title"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
              />
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as DocumentType })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
              >
                <option value="">Select type</option>
                {allowedTypes.map((t) => (
                  <option key={t} value={t}>
                    {TYPE_LABELS[t] ?? t}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={form.issueDate}
                  onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg"
                />
                <input
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg"
                />
              </div>
              <input
                value={form.fileName}
                onChange={(e) => setForm({ ...form, fileName: e.target.value })}
                placeholder="File name"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
              />
              <input
                value={form.fileUrl}
                onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
                placeholder="File URL (metadata only)"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={form.mimeType}
                  onChange={(e) => setForm({ ...form, mimeType: e.target.value })}
                  placeholder="MIME type"
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg"
                />
                <input
                  type="number"
                  value={form.size}
                  onChange={(e) => setForm({ ...form, size: Number(e.target.value) })}
                  placeholder="Size (bytes)"
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={saving}
                className="px-4 py-2 text-sm bg-primary text-white rounded-lg disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{selected.title}</h2>
              <button type="button" onClick={() => setSelected(null)} className="text-gray-400">
                ✕
              </button>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm mb-4">
              <div>
                <dt className="text-gray-500">Type</dt>
                <dd>{TYPE_LABELS[selected.type as DocumentType] ?? selected.type}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Status</dt>
                <dd>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[selected.status as DocumentStatus]}`}
                  >
                    {selected.status}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Owner</dt>
                <dd>{selected.ownerLabel ?? selected.ownerId}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Expiry</dt>
                <dd>{selected.expiryDate ? formatDate(selected.expiryDate) : '—'}</dd>
              </div>
            </dl>
            <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm">
              <p className="font-medium mb-1">Current file</p>
              <p>{selected.currentRevision.fileName}</p>
              <p className="text-gray-500 text-xs mt-1">
                {selected.currentRevision.mimeType} · {selected.currentRevision.size} bytes
              </p>
              <a
                href={selected.currentRevision.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline text-xs mt-2 inline-block"
              >
                Download link
              </a>
            </div>
            <div>
              <h3 className="text-xs font-medium text-gray-500 uppercase mb-2">Version history</h3>
              <div className="space-y-2">
                {selected.revisions.map((rev) => (
                  <div
                    key={rev.id}
                    className="flex items-center justify-between p-2 border border-gray-100 rounded-lg text-sm"
                  >
                    <div>
                      <span className="font-medium">v{rev.version}</span> — {rev.fileName}
                      <p className="text-xs text-gray-400">{formatDateTime(rev.createdAt)}</p>
                    </div>
                    <a
                      href={rev.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary text-xs hover:underline"
                    >
                      Download
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
