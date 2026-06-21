import { useEffect, useMemo, useState, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { calculateCashToDeliver, ExpenseCategory } from '@hanbey-fleet/shared';
import { driverPortalApi } from '../lib/api';
import { DriverPortalOverviewDto } from '../types/api';
import { formatCurrency } from '../lib/utils';
import { Plus, Trash2 } from 'lucide-react';

const EXPENSE_OPTIONS = [
  { value: ExpenseCategory.FUEL, label: 'Yakıt' },
  { value: ExpenseCategory.PARKING, label: 'Otopark' },
  { value: ExpenseCategory.CLEANING, label: 'Araç Yıkama' },
  { value: ExpenseCategory.OTHER, label: 'Diğer' },
];

interface ExpenseRow {
  id: string;
  category: ExpenseCategory;
  amount: string;
  note: string;
}

export function EndOfDayPage() {
  const { shiftId } = useParams<{ shiftId: string }>();
  const navigate = useNavigate();
  const [overview, setOverview] = useState<DriverPortalOverviewDto | null>(null);
  const [declaredHgs, setDeclaredHgs] = useState('');
  const [posAmount, setPosAmount] = useState('');
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [updateMileage, setUpdateMileage] = useState(false);
  const [closingMileage, setClosingMileage] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    driverPortalApi
      .overview()
      .then(({ data }) => setOverview(data))
      .finally(() => setLoading(false));
  }, []);

  const dailyFee = overview?.currentAssignment?.vehicle.dailyFee ?? 0;
  const hgs = Number(declaredHgs) || 0;
  const pos = Number(posAmount) || 0;
  const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const cashToDeliver = useMemo(
    () => calculateCashToDeliver(dailyFee, hgs, pos, totalExpenses),
    [dailyFee, hgs, pos, totalExpenses],
  );

  const addExpense = () => {
    setExpenses((prev) => [
      ...prev,
      { id: crypto.randomUUID(), category: ExpenseCategory.FUEL, amount: '', note: '' },
    ]);
  };

  const removeExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const updateExpense = (id: string, patch: Partial<ExpenseRow>) => {
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!shiftId) return;

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const { data } = await driverPortalApi.endOfDay(shiftId, {
        declaredHgs: hgs,
        posAmount: pos,
        expenses: expenses
          .filter((row) => Number(row.amount) > 0)
          .map((row) => ({
            category: row.category,
            amount: Number(row.amount),
            note: row.note || undefined,
          })),
        updateMileage,
        closingMileage: updateMileage ? Number(closingMileage) : undefined,
        notes: notes || undefined,
      });

      setSuccess(`Gün sonu tamamlandı. Kasaya teslim: ${formatCurrency(data.cashToDeliver)}`);
      setTimeout(() => navigate('/'), 2000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Gün sonu gönderilemedi.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Gün Sonu</h2>
        <p className="text-sm text-gray-500">Vardiya kapanış bilgilerini girin</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <label className="text-sm font-medium text-gray-700">Araç Yevmiyesi</label>
          <p className="mt-1 text-2xl font-bold text-gray-900">{formatCurrency(dailyFee)}</p>
          <p className="text-xs text-gray-400">Araçtan otomatik alınır</p>
        </div>

        <Field label="HGS (opsiyonel)" value={declaredHgs} onChange={setDeclaredHgs} placeholder="0" />
        <Field label="POS (opsiyonel)" value={posAmount} onChange={setPosAmount} placeholder="0" />

        <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-medium text-gray-800">Giderler (opsiyonel)</p>
            <button
              type="button"
              onClick={addExpense}
              className="flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700"
            >
              <Plus className="h-4 w-4" /> Ekle
            </button>
          </div>

          {expenses.length === 0 && (
            <p className="text-sm text-gray-400">Henüz gider eklenmedi.</p>
          )}

          {expenses.map((row) => (
            <div key={row.id} className="rounded-xl border border-gray-100 bg-gray-50 p-3 space-y-2">
              <div className="flex gap-2">
                <select
                  value={row.category}
                  onChange={(e) => updateExpense(row.id, { category: e.target.value as ExpenseCategory })}
                  className="flex-1 rounded-lg border border-gray-300 px-2 py-2 text-sm"
                >
                  {EXPENSE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <button type="button" onClick={() => removeExpense(row.id)} className="p-2 text-red-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Tutar"
                value={row.amount}
                onChange={(e) => updateExpense(row.id, { amount: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="Not"
                value={row.note}
                onChange={(e) => updateExpense(row.id, { note: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          ))}
        </div>

        <label className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4">
          <input
            type="checkbox"
            checked={updateMileage}
            onChange={(e) => setUpdateMileage(e.target.checked)}
            className="h-5 w-5 rounded border-gray-300"
          />
          <span className="text-sm font-medium text-gray-800">Araç kilometresini güncelle</span>
        </label>

        {updateMileage && (
          <Field
            label="Güncel KM"
            value={closingMileage}
            onChange={setClosingMileage}
            placeholder="185760"
          />
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Not (opsiyonel)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Gün sonu notu"
          />
        </div>

        <div className="rounded-2xl border-2 border-primary bg-blue-50 p-5 text-center">
          <p className="text-sm font-medium text-primary">Kasaya Teslim Edilecek (ön izleme)</p>
          <p className="mt-1 text-3xl font-bold text-primary">{formatCurrency(cashToDeliver)}</p>
          <p className="mt-2 text-xs text-gray-500">
            {formatCurrency(dailyFee)} + {formatCurrency(hgs)} − {formatCurrency(pos)} − {formatCurrency(totalExpenses)}
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}
        {success && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">{success}</div>
        )}

        <button
          type="submit"
          disabled={submitting || dailyFee <= 0}
          className="w-full rounded-2xl bg-primary py-5 text-lg font-bold text-white shadow-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {submitting ? 'Gönderiliyor...' : 'Gün Sonunu Tamamla'}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <input
        type="number"
        min="0"
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  );
}
