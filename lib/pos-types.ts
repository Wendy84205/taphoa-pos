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
  units?: ProductUnit[];
  createdAt: string;
  updatedAt: string;
};

export type CartItem = {
  id?: string;
  productId: string;
  name: string;
  price: number;
  unit: string;
  quantity: number;
  stockQuantity: number;
  unitId?: string;
  conversionToBase?: number;
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
  paymentMethod?: PaymentMethod;
  customerId?: string;
  customerName?: string;
  amountReceived?: number;
  debtAmount?: number;
};

export type PaymentMethod = "cash" | "bank_transfer" | "debt";

export type ProductUnit = {
  id: string;
  label: string;
  conversionToBase: number;
  price: number;
  isBase?: boolean;
};

export type Customer = {
  id: string;
  name: string;
  phone?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
};

export type DebtTransactionType = "charge" | "payment";

export type DebtTransaction = {
  id: string;
  customerId: string;
  customerName: string;
  type: DebtTransactionType;
  amount: number;
  orderId?: string;
  note: string;
  createdAt: string;
};

export type PaymentSettings = {
  bankBin: string;
  accountNumber: string;
  accountName: string;
};

export type Supplier = {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  openingBalance?: number;
  createdAt: string;
};

export type StockReceipt = {
  id: string;
  supplierId?: string;
  supplierName?: string;
  totalAmount: number;
  debtAmount: number;
  createdAt: string;
};

export type ExpiryBatch = {
  id: string;
  productId: string;
  quantity: number;
  expiresAt: string;
  createdAt: string;
};

export type InventoryActivityType = "import" | "adjustment" | "sale" | "initial" | "update";

export type InventoryActivity = {
  id: string;
  productId: string;
  productName: string;
  type: InventoryActivityType;
  quantityBefore: number;
  quantityChange: number;
  quantityAfter: number;
  note: string;
  createdAt: string;
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
