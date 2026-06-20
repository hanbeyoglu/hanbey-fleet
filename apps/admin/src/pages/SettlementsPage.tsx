export function SettlementsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settlements</h1>
        <p className="text-sm text-gray-500 mt-1">
          Shift-based settlements will be available in a future sprint. Use Shifts and Driver Reports
          in the API for now.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <p className="text-gray-400 text-sm">No settlement module in the current API.</p>
      </div>
    </div>
  );
}
