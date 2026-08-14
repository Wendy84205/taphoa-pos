export type Product = {
  id: string;
  name: string;
  price: number;
  costPrice?: number;
  unit: string;
  category: string;
  barcode?: string;
  imageUri?: string;
  stockQuantity: number;
  lowStockThreshold: number;
  createdAt: string;
  updatedAt: string;
};

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  unit: string;
  quantity: number;
  stockQuantity: number;
};

export type OrderItem = {
  productId: string;
  name: string;
  quantity: number;
  unit: string;
  priceAtSale: number;
};

export type Order = {
  id: string;
  createdAt: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  totalAmount: number;
};

export type ProductDraft = Omit<Product, "id" | "createdAt" | "updatedAt">;

export const PRODUCT_CATEGORIES = [
  "Tất cả",
  "Nước giải khát",
  "Bánh kẹo",
  "Gia vị",
  "Thực phẩm",
  "Hàng gia dụng",
  "Khác",
] as const;
