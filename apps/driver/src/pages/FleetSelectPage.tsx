import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function FleetSelectPage() {
  const { fleetMemberships, selectFleet } = useAuth();
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mb-2 text-5xl">🚕</div>
          <h1 className="text-xl font-bold text-gray-900">Filo Seçimi</h1>
          <p className="mt-1 text-sm text-gray-500">Çalışacağınız filoyu seçin</p>
        </div>

        <div className="space-y-3">
          {fleetMemberships.map((m) => (
            <button
              key={m.membershipId}
              type="button"
              disabled={loading}
              onClick={() => handleSelect(m.fleetOwnerId)}
              className="flex w-full items-center justify-between rounded-xl border border-gray-200 px-4 py-4 text-left transition-colors hover:border-primary hover:bg-blue-50 disabled:opacity-50"
            >
              <div className="font-medium text-gray-900">{m.fleetOwnerName}</div>
              <span className="text-primary text-lg">→</span>
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
