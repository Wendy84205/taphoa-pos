import { isLowStock } from "./pos-calculations";
import type { InventoryActivity, InventoryActivityType, Product } from "./pos-types";

export type InventoryActivityFilter = "all" | InventoryActivityType;
export type LowStockSort = "priority" | "quantity" | "name";

export function filterInventoryActivities(activities: InventoryActivity[], type: InventoryActivityFilter, productId: string) {
  return activities.filter((activity) => (type === "all" || activity.type === type) && (productId === "all" || activity.productId === productId));
}

export function sortLowStockProducts(products: Product[], category: string, sort: LowStockSort) {
  return products.filter((product) => isLowStock(product) && (category === "Tất cả" || product.category === category)).sort((left, right) => {
    if (sort === "name") return left.name.localeCompare(right.name, "vi");
    if (sort === "quantity") return left.stockQuantity - right.stockQuantity;
    const leftRatio = left.stockQuantity / Math.max(left.lowStockThreshold, 1);
    const rightRatio = right.stockQuantity / Math.max(right.lowStockThreshold, 1);
    return leftRatio - rightRatio || left.stockQuantity - right.stockQuantity;
  });
}
