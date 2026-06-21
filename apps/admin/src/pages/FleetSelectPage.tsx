import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Role } from '@hanbey-fleet/shared';
import { useAuth } from '../contexts/AuthContext';

export function FleetSelectPage() {
  const { user, fleetMemberships, selectFleet, enterGlobalMode } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSelect = async (fleetOwnerId: string) => {
    setError('');
    setLoading(true);
    try {
      await selectFleet(fleetOwnerId);
      navigate('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Filo seçilemedi.');
    } finally {
      setLoading(false);
    }
  };

  const handleGlobalMode = async () => {
    setLoading(true);
    try {
      await enterGlobalMode();
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mb-2 text-4xl">🚕</div>
          <h1 className="text-xl font-bold text-gray-900">Filo Seçimi</h1>
          <p className="mt-1 text-sm text-gray-500">
            {user?.role === Role.SUPER_ADMIN
              ? 'Bir filo seçin veya tüm filoları görüntüleyin'
              : 'Devam etmek için bir filo seçin'}
          </p>
        </div>

        <div className="space-y-3">
          {fleetMemberships.map((m) => (
            <button
              key={m.membershipId}
              type="button"
              disabled={loading}
              onClick={() => handleSelect(m.fleetOwnerId)}
              className="flex w-full items-center justify-between rounded-lg border border-gray-200 px-4 py-3 text-left transition-colors hover:border-primary hover:bg-blue-50 disabled:opacity-50"
            >
              <div>
                <div className="font-medium text-gray-900">{m.fleetOwnerName}</div>
                <div className="text-xs text-gray-500 uppercase">{m.role}</div>
              </div>
              <span className="text-primary">→</span>
            </button>
          ))}
        </div>

        {user?.role === Role.SUPER_ADMIN && (
          <button
            type="button"
            disabled={loading}
            onClick={handleGlobalMode}
            className="mt-4 w-full rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm font-medium text-gray-600 transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
          >
            Tüm Filolar (Global Mod)
          </button>
        )}

        {error && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
