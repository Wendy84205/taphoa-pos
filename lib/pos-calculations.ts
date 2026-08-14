import type { CartItem, Product } from "@/lib/pos-types";

export function formatVnd(amount: number) {
  return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(Math.max(0, amount))}đ`;
}

export function calculateSubtotal(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function calculateTotal(items: CartItem[], discount: number) {
  return Math.max(0, calculateSubtotal(items) - Math.max(0, discount));
}

export function filterProducts(products: Product[], query: string, category: string) {
  const normalizedQuery = query.trim().toLocaleLowerCase("vi-VN");
  return products.filter((product) => {
    const matchesCategory = category === "Tất cả" || product.category === category;
    const searchable = `${product.name} ${product.barcode ?? ""}`.toLocaleLowerCase("vi-VN");
    return matchesCategory && (!normalizedQuery || searchable.includes(normalizedQuery));
  });
}

export function isLowStock(product: Pick<Product, "stockQuantity" | "lowStockThreshold">) {
  return product.stockQuantity <= product.lowStockThreshold;
}
