import { useCallback, useEffect, useState } from 'react';
import { driverPortalApi, unwrapPaginated } from '../lib/api';
import { DocumentResponseDto } from '../types/api';
import { formatDateTime } from '../lib/utils';

export function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentResponseDto[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    driverPortalApi
      .documents({ page: 1, limit: 50 })
      .then(({ data }) => {
        const { data: items } = unwrapPaginated<DocumentResponseDto>(data);
        setDocuments(items);
      })
      .catch(() => setDocuments([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Belgelerim</h2>

      {documents.length === 0 ? (
        <p className="py-12 text-center text-gray-400">Kayıtlı belge bulunamadı.</p>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <article key={doc.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-gray-900">{doc.title}</h3>
                  <p className="text-sm text-gray-500">{doc.type.replace(/_/g, ' ')}</p>
                </div>
                {doc.status && (
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                    {doc.status}
                  </span>
                )}
              </div>
              {doc.expiryDate && (
                <p className="mt-2 text-sm text-gray-600">
                  Son geçerlilik: {formatDateTime(doc.expiryDate)}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
