import { describe, expect, it } from "vitest";
import { calculateSubtotal, calculateTotal, filterProducts, formatVnd, isLowStock } from "../lib/pos-calculations";
import type { CartItem, Product } from "../lib/pos-types";

const product: Product = { id: "1", name: "Nước suối", price: 7000, unit: "chai", category: "Nước giải khát", barcode: "123", stockQuantity: 4, lowStockThreshold: 5, createdAt: "", updatedAt: "" };
const items: CartItem[] = [{ productId: "1", name: "Nước suối", price: 7000, unit: "chai", quantity: 3, stockQuantity: 4 }];

describe("nghiệp vụ POS", () => {
  it("tính đúng tạm tính và tổng tiền sau giảm giá", () => { expect(calculateSubtotal(items)).toBe(21000); expect(calculateTotal(items, 2500)).toBe(18500); expect(calculateTotal(items, 99999)).toBe(0); });
  it("định dạng tiền VND và phát hiện hàng sắp hết", () => { expect(formatVnd(25000)).toBe("25.000đ"); expect(isLowStock(product)).toBe(true); });
  it("tìm theo tên, mã vạch và nhóm hàng", () => { expect(filterProducts([product], "suối", "Tất cả")).toHaveLength(1); expect(filterProducts([product], "123", "Nước giải khát")).toHaveLength(1); expect(filterProducts([product], "123", "Bánh kẹo")).toHaveLength(0); });
});
