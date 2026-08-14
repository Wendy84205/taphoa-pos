import type { CartItem, ComboRule, Promotion } from "@/lib/pos-types";

export function calculatePromotionDiscount(cart: CartItem[], promotion: Promotion): number {
  if (!promotion.active) return 0;
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  if (promotion.minSubtotal && subtotal < promotion.minSubtotal) return 0;
  const eligible = promotion.productIds?.length ? cart.filter((item) => promotion.productIds?.includes(item.productId)) : cart;
  const eligibleSubtotal = eligible.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const raw = promotion.kind === "percent" ? eligibleSubtotal * Math.min(Math.max(promotion.value, 0), 100) / 100 : promotion.value;
  return Math.min(Math.max(0, Math.round(raw)), subtotal);
}

export function calculateComboDiscount(cart: CartItem[], combo: ComboRule): number {
  if (!combo.active || combo.requiredQuantity <= 0 || combo.comboPrice < 0) return 0;
  const eligibleQuantity = cart.filter((item) => combo.productIds.includes(item.productId)).reduce((sum, item) => sum + item.quantity, 0);
  const sets = Math.floor(eligibleQuantity / combo.requiredQuantity);
  if (!sets) return 0;
  const eligibleUnitPrice = cart.filter((item) => combo.productIds.includes(item.productId)).reduce((sum, item) => sum + item.price * item.quantity, 0) / Math.max(eligibleQuantity, 1);
  return Math.max(0, Math.round(sets * (eligibleUnitPrice * combo.requiredQuantity - combo.comboPrice)));
}

export function calculateBestDiscount(cart: CartItem[], promotions: Promotion[], combos: ComboRule[]): number {
  const promotionDiscount = promotions.reduce((best, item) => Math.max(best, calculatePromotionDiscount(cart, item)), 0);
  const comboDiscount = combos.reduce((best, item) => Math.max(best, calculateComboDiscount(cart, item)), 0);
  return Math.max(promotionDiscount, comboDiscount);
}
