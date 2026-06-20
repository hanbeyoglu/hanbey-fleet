import { useEffect, useState } from 'react';
import { expensesApi } from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';
import { ExpenseCategory } from '@taxiledger/shared';

interface Expense {
  id: string;
  category: ExpenseCategory;
  amount: string;
  date: string;
  description?: string;
  vehicle: { plate: string };
}

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  [ExpenseCategory.FUEL]: 'bg-blue-100 text-blue-700',
  [ExpenseCategory.MAINTENANCE]: 'bg-yellow-100 text-yellow-700',
  [ExpenseCategory.INSURANCE]: 'bg-purple-100 text-purple-700',
  [ExpenseCategory.TAX]: 'bg-red-100 text-red-700',
  [ExpenseCategory.HGS]: 'bg-orange-100 text-orange-700',
  [ExpenseCategory.OTHER]: 'bg-gray-100 text-gray-700',
};

export function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    expensesApi.list().then(({ data }) => setExpenses(data)).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
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
                {['Date', 'Vehicle', 'Category', 'Description', 'Amount'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {expenses.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{formatDate(e.date)}</td>
                  <td className="px-4 py-3 font-mono">{e.vehicle.plate}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${CATEGORY_COLORS[e.category]}`}>
                      {e.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{e.description || '—'}</td>
                  <td className="px-4 py-3 font-medium text-red-600">{formatCurrency(Number(e.amount))}</td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">No expenses recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
