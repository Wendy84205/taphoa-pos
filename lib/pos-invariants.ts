import type { StockReceiptItem } from "@/lib/pos-types";

export function capDebtPayment(outstanding: number, requested: number) {
  if (!Number.isFinite(outstanding) || !Number.isFinite(requested) || outstanding <= 0 || requested <= 0) return 0;
  return Math.min(Math.round(requested), Math.max(0, Math.round(outstanding)));
}

export function aggregateStockReceiptItems(items: StockReceiptItem[]) {
  const aggregated = new Map<string, StockReceiptItem>();
  for (const item of items) {
    const previous = aggregated.get(item.productId);
    if (!previous) {
      aggregated.set(item.productId, { ...item });
      continue;
    }
    const quantity = previous.quantity + item.quantity;
    const weightedCost = (previous.quantity * previous.unitCost + item.quantity * item.unitCost) / quantity;
    aggregated.set(item.productId, { ...previous, quantity, unitCost: Math.round(weightedCost) });
  }
  return Array.from(aggregated.values());
}
