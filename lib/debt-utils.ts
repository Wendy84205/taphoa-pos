import type { DebtTransaction } from "@/lib/pos-types";

export function customerDebtBalance(transactions: DebtTransaction[], customerId: string) {
  return transactions.filter((transaction) => transaction.customerId === customerId).reduce((sum, transaction) => sum + (transaction.type === "charge" ? transaction.amount : -transaction.amount), 0);
}

export function debtAgeDays(transactions: DebtTransaction[], customerId: string, referenceDate = new Date()) {
  const oldestCharge = transactions.filter((transaction) => transaction.customerId === customerId && transaction.type === "charge").sort((left, right) => left.createdAt.localeCompare(right.createdAt))[0];
  if (!oldestCharge) return 0;
  return Math.max(0, Math.floor((referenceDate.getTime() - new Date(oldestCharge.createdAt).getTime()) / 86_400_000));
}
