import { describe, expect, it } from "vitest";
import { filterInventoryActivities, sortLowStockProducts } from "../lib/inventory-history";
import type { InventoryActivity, Product } from "../lib/pos-types";

const products: Product[] = [
  { id: "a", name: "Bánh", price: 5000, unit: "gói", category: "Bánh kẹo", stockQuantity: 4, lowStockThreshold: 8, createdAt: "", updatedAt: "" },
  { id: "b", name: "Nước", price: 7000, unit: "chai", category: "Nước giải khát", stockQuantity: 2, lowStockThreshold: 3, createdAt: "", updatedAt: "" },
  { id: "c", name: "Mì", price: 4000, unit: "gói", category: "Thực phẩm", stockQuantity: 15, lowStockThreshold: 5, createdAt: "", updatedAt: "" },
];
const activities: InventoryActivity[] = [
  { id: "1", productId: "a", productName: "Bánh", type: "import", quantityBefore: 1, quantityChange: 3, quantityAfter: 4, note: "Nhập hàng", createdAt: "2026-08-14T08:00:00Z" },
  { id: "2", productId: "a", productName: "Bánh", type: "sale", quantityBefore: 5, quantityChange: -1, quantityAfter: 4, note: "Bán hàng", createdAt: "2026-08-14T09:00:00Z" },
  { id: "3", productId: "b", productName: "Nước", type: "adjustment", quantityBefore: 1, quantityChange: 1, quantityAfter: 2, note: "Kiểm kho", createdAt: "2026-08-14T10:00:00Z" },
];

describe("lịch sử kho và cảnh báo tồn thấp", () => {
  it("lọc lịch sử theo loại biến động và sản phẩm", () => {
    expect(filterInventoryActivities(activities, "import", "all")).toHaveLength(1);
    expect(filterInventoryActivities(activities, "all", "a")).toHaveLength(2);
    expect(filterInventoryActivities(activities, "sale", "b")).toHaveLength(0);
  });

  it("lọc nhóm và sắp xếp cảnh báo theo mức độ thiếu", () => {
    expect(sortLowStockProducts(products, "Tất cả", "priority").map((product) => product.id)).toEqual(["a", "b"]);
    expect(sortLowStockProducts(products, "Nước giải khát", "quantity").map((product) => product.id)).toEqual(["b"]);
    expect(sortLowStockProducts(products, "Tất cả", "name").map((product) => product.id)).toEqual(["a", "b"]);
  });
});
