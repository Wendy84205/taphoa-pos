import type { Product, ProductUnit } from "@/lib/pos-types";

export function getProductUnits(product: Product): ProductUnit[] {
  if (product.units?.length) return [...product.units].sort((left, right) => left.conversionToBase - right.conversionToBase);
  return [{ id: "base", label: product.unit, conversionToBase: 1, price: product.price, isBase: true }];
}

export function getBaseUnit(product: Product) {
  return getProductUnits(product).find((unit) => unit.isBase || unit.conversionToBase === 1) ?? getProductUnits(product)[0];
}

export function calculateBaseQuantity(quantity: number, unit: ProductUnit) {
  return Math.max(0, quantity) * Math.max(1, unit.conversionToBase);
}
