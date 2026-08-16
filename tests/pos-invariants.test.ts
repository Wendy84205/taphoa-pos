import { describe, expect, it } from "vitest";

import { aggregateStockReceiptItems, capDebtPayment } from "../lib/pos-invariants";

describe("POS business invariants", () => {
  it("does not allow debt payment above the outstanding balance", () => {
    expect(capDebtPayment(70000, 100000)).toBe(70000);
    expect(capDebtPayment(70000, 50000)).toBe(50000);
    expect(capDebtPayment(0, 1000)).toBe(0);
  });

  it("aggregates duplicate receipt rows and calculates weighted unit cost", () => {
    const result = aggregateStockReceiptItems([
      { productId: "p1", productName: "Nước suối", quantity: 10, unitCost: 10000 },
      { productId: "p1", productName: "Nước suối", quantity: 5, unitCost: 13000 },
      { productId: "p2", productName: "Coca", quantity: 2, unitCost: 20000 },
    ]);

    expect(result).toHaveLength(2);
    expect(result.find((item) => item.productId === "p1")).toMatchObject({ quantity: 15, unitCost: 11000 });
    expect(result.find((item) => item.productId === "p2")).toMatchObject({ quantity: 2, unitCost: 20000 });
  });
});
