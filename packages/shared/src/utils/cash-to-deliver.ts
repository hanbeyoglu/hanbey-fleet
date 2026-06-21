/**
 * Computes cash amount the driver must deliver to the fleet owner at end of day.
 * cashToDeliver = dailyFee + declaredHgs - posAmount - totalExpenses
 */
export function calculateCashToDeliver(
  dailyFee: number,
  declaredHgs: number,
  posAmount: number,
  totalExpenses: number,
  decimals = 2,
): number {
  const factor = 10 ** decimals;
  const raw = dailyFee + declaredHgs - posAmount - totalExpenses;
  return Math.round(raw * factor) / factor;
}
