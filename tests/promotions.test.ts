import { describe, expect, it } from "vitest";
import { calculateBestDiscount, calculateComboDiscount, calculatePromotionDiscount } from "../lib/promotions";
import type { CartItem } from "../lib/pos-types";

const cart: CartItem[] = [
  { id: "p1:base", productId: "p1", name: "Nước suối", price: 7000, unit: "chai", quantity: 3, stockQuantity: 10 },
  { id: "p2:base", productId: "p2", name: "Mì gói", price: 5000, unit: "gói", quantity: 2, stockQuantity: 10 },
];

describe("promotions", () => {
  it("calculates percent and fixed discounts only for eligible items", () => {
    expect(calculatePromotionDiscount(cart, { id: "promo-1", name: "Nước giảm 10%", kind: "percent", value: 10, productIds: ["p1"], active: true, createdAt: "now" })).toBe(2100);
    expect(calculatePromotionDiscount(cart, { id: "promo-2", name: "Giảm 3000", kind: "fixed", value: 3000, productIds: ["p2"], active: true, createdAt: "now" })).toBe(3000);
  });

  it("calculates combo savings and picks the best active offer", () => {
    const combo = { id: "combo-1", name: "3 chai giá 18000", productIds: ["p1"], requiredQuantity: 3, comboPrice: 18000, active: true, createdAt: "now" };
    expect(calculateComboDiscount(cart, combo)).toBe(3000);
    expect(calculateBestDiscount(cart, [{ id: "promo-3", name: "Giảm 5%", kind: "percent", value: 5, productIds: ["p1"], active: true, createdAt: "now" }], [combo])).toBe(3000);
  });
});
