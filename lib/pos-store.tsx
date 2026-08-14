import AsyncStorage from "@react-native-async-storage/async-storage";
import { calculateSubtotal, calculateTotal } from "@/lib/pos-calculations";
import { calculateBestDiscount } from "@/lib/promotions";
import { importProductsIntoCatalog } from "@/lib/product-import";
import { calculateBaseQuantity, getBaseUnit } from "@/lib/product-units";
import type { CartItem, ComboRule, Customer, DebtTransaction, ExpiryBatch, InventoryActivity, InventoryActivityType, Order, PaymentMethod, PaymentReconciliation, PaymentSettings, Product, ProductDraft, ProductUnit, Promotion, Shift, StockReceipt, StockReceiptItem, Supplier, SupplierPayment, TransferReconciliationStatus } from "@/lib/pos-types";
import { createContext, ReactNode, useContext, useEffect, useMemo, useReducer } from "react";

const STORAGE_KEY = "taphoa-pos-v1";
const emptyPaymentSettings: PaymentSettings = { bankBin: "", accountNumber: "", accountName: "" };

type PosState = {
  initialized: boolean;
  products: Product[];
  cart: CartItem[];
  orders: Order[];
  inventoryActivities: InventoryActivity[];
  customers: Customer[];
  debtTransactions: DebtTransaction[];
  paymentSettings: PaymentSettings;
  suppliers: Supplier[];
  stockReceipts: StockReceipt[];
  supplierPayments: SupplierPayment[];
  expiryBatches: ExpiryBatch[];
  shifts: Shift[];
  paymentReconciliations: PaymentReconciliation[];
  promotions: Promotion[];
  comboRules: ComboRule[];
};

type PersistedState = Omit<PosState, "initialized">;
type CheckoutOptions = { paymentMethod?: PaymentMethod; customerId?: string; debtAmount?: number; sellerUserId?: number; sellerName?: string; discountOverride?: number };
type CustomerDraft = Pick<Customer, "name" | "phone" | "note">;

type PosContextValue = PosState & {
  addProduct: (draft: ProductDraft) => void;
  updateProduct: (id: string, draft: ProductDraft) => void;
  deleteProduct: (id: string) => void;
  addToCart: (product: Product, unit?: ProductUnit) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  checkout: (discount: number, options?: CheckoutOptions) => Order | null;
  getProductByBarcode: (barcode: string) => Product | undefined;
  replaceRemoteSnapshot: (products: Product[], orders: Order[]) => void;
  replaceRemoteState: (payload: PersistedState) => void;
  importProducts: (drafts: ProductDraft[]) => { added: number; updated: number };
  adjustStock: (productId: string, quantityChange: number, note: string) => void;
  addCustomer: (draft: CustomerDraft) => Customer;
  updateCustomer: (id: string, draft: CustomerDraft) => void;
  recordDebtPayment: (customerId: string, amount: number, note: string) => void;
  savePaymentSettings: (settings: PaymentSettings) => void;
  addSupplier: (supplier: Omit<Supplier, "id" | "createdAt">) => Supplier;
  recordStockReceipt: (input: { supplierId?: string; supplierName?: string; items: StockReceiptItem[]; paidAmount: number; note?: string }) => StockReceipt | null;
  addExpiryBatch: (batch: Omit<ExpiryBatch, "id" | "createdAt">) => void;
  closeShift: (actualCash: number, note?: string) => Shift | null;
  recordSupplierPayment: (supplierId: string, amount: number, note?: string) => SupplierPayment | null;
  reconcileTransfer: (orderId: string, input: { status: TransferReconciliationStatus; amountConfirmed?: number; reference?: string; note?: string }) => PaymentReconciliation | null;
  addPromotion: (promotion: Omit<Promotion, "id" | "createdAt">) => Promotion;
  addComboRule: (combo: Omit<ComboRule, "id" | "createdAt">) => ComboRule;
  getPersistedState: () => PersistedState;
  restorePersistedState: (payload: PersistedState) => void;
};

type Action =
  | { type: "HYDRATE"; payload: PersistedState }
  | { type: "ADD_PRODUCT"; payload: Product; activity: InventoryActivity }
  | { type: "UPDATE_PRODUCT"; id: string; payload: ProductDraft; activity?: InventoryActivity }
  | { type: "DELETE_PRODUCT"; id: string }
  | { type: "ADD_TO_CART"; payload: Product; unit?: ProductUnit }
  | { type: "UPDATE_CART_QUANTITY"; cartItemId: string; quantity: number }
  | { type: "REMOVE_FROM_CART"; cartItemId: string }
  | { type: "CLEAR_CART" }
  | { type: "CHECKOUT"; payload: { order: Order; activities: InventoryActivity[]; debtTransaction?: DebtTransaction } }
  | { type: "REPLACE_REMOTE_SNAPSHOT"; payload: { products: Product[]; orders: Order[] } }
  | { type: "REPLACE_REMOTE_STATE"; payload: PersistedState }
  | { type: "IMPORT_PRODUCTS"; payload: Product[]; activities: InventoryActivity[] }
  | { type: "ADJUST_STOCK"; productId: string; quantityChange: number; activity: InventoryActivity }
  | { type: "ADD_CUSTOMER"; payload: Customer }
  | { type: "UPDATE_CUSTOMER"; id: string; payload: CustomerDraft }
  | { type: "ADD_DEBT_TRANSACTION"; payload: DebtTransaction }
  | { type: "SAVE_PAYMENT_SETTINGS"; payload: PaymentSettings }
  | { type: "ADD_SUPPLIER"; payload: Supplier }
  | { type: "RECORD_STOCK_RECEIPT"; payload: { receipt: StockReceipt; products: Product[]; activities: InventoryActivity[]; expiryBatches: ExpiryBatch[] } }
  | { type: "ADD_EXPIRY_BATCH"; payload: ExpiryBatch }
  | { type: "CLOSE_SHIFT"; payload: Shift }
  | { type: "ADD_SUPPLIER_PAYMENT"; payload: SupplierPayment }
  | { type: "RECONCILE_TRANSFER"; payload: PaymentReconciliation }
  | { type: "ADD_PROMOTION"; payload: Promotion }
  | { type: "ADD_COMBO_RULE"; payload: ComboRule };

const now = new Date().toISOString();
const seedProducts: Product[] = [
  { id: "p-1", name: "Nước suối Lavie 500ml", price: 7000, costPrice: 5000, unit: "chai", category: "Nước giải khát", barcode: "8934588012225", stockQuantity: 24, lowStockThreshold: 6, createdAt: now, updatedAt: now },
  { id: "p-2", name: "Coca-Cola lon", price: 12000, costPrice: 9000, unit: "lon", category: "Nước giải khát", barcode: "8935049500488", stockQuantity: 18, lowStockThreshold: 8, createdAt: now, updatedAt: now },
  { id: "p-3", name: "Mì Hảo Hảo tôm chua cay", price: 4500, costPrice: 3600, unit: "gói", category: "Thực phẩm", barcode: "8934563651075", stockQuantity: 40, lowStockThreshold: 12, createdAt: now, updatedAt: now },
  { id: "p-4", name: "Bánh Oreo vị vani", price: 9000, costPrice: 7000, unit: "gói", category: "Bánh kẹo", barcode: "8934605010231", stockQuantity: 7, lowStockThreshold: 8, createdAt: now, updatedAt: now },
  { id: "p-5", name: "Nước mắm Nam Ngư 500ml", price: 28000, costPrice: 23000, unit: "chai", category: "Gia vị", barcode: "8934687003343", stockQuantity: 10, lowStockThreshold: 4, createdAt: now, updatedAt: now },
  { id: "p-6", name: "Trứng gà tươi", price: 3500, costPrice: 2800, unit: "quả", category: "Thực phẩm", stockQuantity: 52, lowStockThreshold: 15, createdAt: now, updatedAt: now },
];

const initialState: PosState = { initialized: false, products: seedProducts, cart: [], orders: [], inventoryActivities: [], customers: [], debtTransactions: [], paymentSettings: emptyPaymentSettings, suppliers: [], stockReceipts: [], supplierPayments: [], expiryBatches: [], shifts: [], paymentReconciliations: [], promotions: [], comboRules: [] };
const PosContext = createContext<PosContextValue | null>(null);

function reducer(state: PosState, action: Action): PosState {
  switch (action.type) {
    case "HYDRATE": return { initialized: true, products: action.payload.products, cart: action.payload.cart, orders: action.payload.orders, inventoryActivities: action.payload.inventoryActivities ?? [], customers: action.payload.customers ?? [], debtTransactions: action.payload.debtTransactions ?? [], paymentSettings: action.payload.paymentSettings ?? emptyPaymentSettings, suppliers: action.payload.suppliers ?? [], stockReceipts: action.payload.stockReceipts ?? [], supplierPayments: action.payload.supplierPayments ?? [], expiryBatches: action.payload.expiryBatches ?? [], shifts: action.payload.shifts ?? [], paymentReconciliations: action.payload.paymentReconciliations ?? [], promotions: action.payload.promotions ?? [], comboRules: action.payload.comboRules ?? [] };
    case "ADD_PRODUCT": return { ...state, products: [action.payload, ...state.products], inventoryActivities: [action.activity, ...state.inventoryActivities] };
    case "UPDATE_PRODUCT": return { ...state, products: state.products.map((product) => product.id === action.id ? { ...product, ...action.payload, updatedAt: new Date().toISOString() } : product), inventoryActivities: action.activity ? [action.activity, ...state.inventoryActivities] : state.inventoryActivities };
    case "DELETE_PRODUCT": return { ...state, products: state.products.filter((product) => product.id !== action.id), cart: state.cart.filter((item) => item.productId !== action.id) };
    case "ADD_TO_CART": {
      const unit = action.unit ?? getBaseUnit(action.payload);
      const lineId = `${action.payload.id}:${unit.id}`;
      const available = Math.floor(action.payload.stockQuantity / Math.max(1, unit.conversionToBase));
      const existing = state.cart.find((item) => item.id === lineId);
      if (existing) return { ...state, cart: state.cart.map((item) => item.id === lineId ? { ...item, quantity: Math.min(item.quantity + 1, available) } : item) };
      if (action.payload.stockQuantity <= 0) return state;
      return { ...state, cart: [...state.cart, { id: lineId, productId: action.payload.id, name: action.payload.name, price: unit.price, unit: unit.label, quantity: 1, stockQuantity: available, unitId: unit.id, conversionToBase: unit.conversionToBase }] };
    }
    case "UPDATE_CART_QUANTITY": return { ...state, cart: state.cart.map((item) => item.id === action.cartItemId ? { ...item, quantity: Math.min(Math.max(0, action.quantity), item.stockQuantity) } : item).filter((item) => item.quantity > 0) };
    case "REMOVE_FROM_CART": return { ...state, cart: state.cart.filter((item) => item.id !== action.cartItemId) };
    case "CLEAR_CART": return { ...state, cart: [] };
    case "CHECKOUT": return { ...state, orders: [action.payload.order, ...state.orders], cart: [], inventoryActivities: [...action.payload.activities, ...state.inventoryActivities], debtTransactions: action.payload.debtTransaction ? [action.payload.debtTransaction, ...state.debtTransactions] : state.debtTransactions, products: state.products.map((product) => { const soldBase = state.cart.filter((item) => item.productId === product.id).reduce((sum, item) => sum + calculateBaseQuantity(item.quantity, { id: item.unitId ?? "base", label: item.unit, conversionToBase: item.conversionToBase ?? 1, price: item.price }), 0); return soldBase ? { ...product, stockQuantity: Math.max(0, product.stockQuantity - soldBase), updatedAt: new Date().toISOString() } : product; }) };
    case "REPLACE_REMOTE_SNAPSHOT": return { ...state, products: action.payload.products, orders: action.payload.orders };
    case "REPLACE_REMOTE_STATE": return { ...state, products: action.payload.products, orders: action.payload.orders, inventoryActivities: action.payload.inventoryActivities ?? [], customers: action.payload.customers ?? [], debtTransactions: action.payload.debtTransactions ?? [], paymentSettings: action.payload.paymentSettings ?? emptyPaymentSettings, suppliers: action.payload.suppliers ?? [], stockReceipts: action.payload.stockReceipts ?? [], supplierPayments: action.payload.supplierPayments ?? [], expiryBatches: action.payload.expiryBatches ?? [], shifts: action.payload.shifts ?? [], paymentReconciliations: action.payload.paymentReconciliations ?? [], promotions: action.payload.promotions ?? [], comboRules: action.payload.comboRules ?? [] };
    case "IMPORT_PRODUCTS": return { ...state, products: action.payload, inventoryActivities: [...action.activities, ...state.inventoryActivities] };
    case "ADJUST_STOCK": return { ...state, products: state.products.map((product) => product.id === action.productId ? { ...product, stockQuantity: Math.max(0, product.stockQuantity + action.quantityChange), updatedAt: new Date().toISOString() } : product), inventoryActivities: [action.activity, ...state.inventoryActivities] };
    case "ADD_CUSTOMER": return { ...state, customers: [action.payload, ...state.customers] };
    case "UPDATE_CUSTOMER": return { ...state, customers: state.customers.map((customer) => customer.id === action.id ? { ...customer, ...action.payload, updatedAt: new Date().toISOString() } : customer) };
    case "ADD_DEBT_TRANSACTION": return { ...state, debtTransactions: [action.payload, ...state.debtTransactions] };
    case "SAVE_PAYMENT_SETTINGS": return { ...state, paymentSettings: action.payload };
    case "ADD_SUPPLIER": return { ...state, suppliers: [action.payload, ...state.suppliers] };
    case "RECORD_STOCK_RECEIPT": return { ...state, products: action.payload.products, stockReceipts: [action.payload.receipt, ...state.stockReceipts], inventoryActivities: [...action.payload.activities, ...state.inventoryActivities], expiryBatches: [...action.payload.expiryBatches, ...state.expiryBatches] };
    case "ADD_EXPIRY_BATCH": return { ...state, expiryBatches: [action.payload, ...state.expiryBatches] };
    case "CLOSE_SHIFT": return { ...state, shifts: [action.payload, ...state.shifts] };
    case "ADD_SUPPLIER_PAYMENT": return { ...state, supplierPayments: [action.payload, ...state.supplierPayments] };
    case "RECONCILE_TRANSFER": return { ...state, paymentReconciliations: [action.payload, ...state.paymentReconciliations.filter((item) => item.orderId !== action.payload.orderId)], orders: state.orders.map((order) => order.id === action.payload.orderId ? { ...order, transferReconciliationId: action.payload.id, transferReconciliationStatus: action.payload.status } : order) };
    case "ADD_PROMOTION": return { ...state, promotions: [action.payload, ...state.promotions] };
    case "ADD_COMBO_RULE": return { ...state, comboRules: [action.payload, ...state.comboRules] };
    default: return state;
  }
}

export function PosStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  useEffect(() => { AsyncStorage.getItem(STORAGE_KEY).then((raw) => { if (!raw) { dispatch({ type: "HYDRATE", payload: initialState }); return; } const saved = JSON.parse(raw) as PersistedState; dispatch({ type: "HYDRATE", payload: { ...initialState, ...saved, inventoryActivities: saved.inventoryActivities ?? [], customers: saved.customers ?? [], debtTransactions: saved.debtTransactions ?? [], paymentSettings: saved.paymentSettings ?? emptyPaymentSettings } }); }).catch(() => dispatch({ type: "HYDRATE", payload: initialState })); }, []);
  useEffect(() => { if (state.initialized) { const { initialized, ...payload } = state; AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload)).catch(() => undefined); } }, [state]);

  const value = useMemo<PosContextValue>(() => ({
    ...state,
    addProduct: (draft) => { const timestamp = new Date().toISOString(); const product = { ...draft, id: `p-${Date.now()}`, createdAt: timestamp, updatedAt: timestamp }; dispatch({ type: "ADD_PRODUCT", payload: product, activity: createActivity(product, "initial", 0, product.stockQuantity, "Tạo sản phẩm mới") }); },
    updateProduct: (id, draft) => { const previous = state.products.find((product) => product.id === id); const quantityChange = previous ? draft.stockQuantity - previous.stockQuantity : 0; const activity = previous && quantityChange !== 0 ? createActivity(previous, "adjustment", previous.stockQuantity, quantityChange, "Điều chỉnh tồn khi sửa sản phẩm") : undefined; dispatch({ type: "UPDATE_PRODUCT", id, payload: draft, activity }); },
    deleteProduct: (id) => dispatch({ type: "DELETE_PRODUCT", id }),
    addToCart: (product, unit) => dispatch({ type: "ADD_TO_CART", payload: product, unit }),
    updateCartQuantity: (cartItemId, quantity) => dispatch({ type: "UPDATE_CART_QUANTITY", cartItemId, quantity }),
    removeFromCart: (cartItemId) => dispatch({ type: "REMOVE_FROM_CART", cartItemId }),
    clearCart: () => dispatch({ type: "CLEAR_CART" }),
    checkout: (discount, options = {}) => {
      if (!state.cart.length) return null;
      const safeDiscount = Math.min(Math.max(0, discount), calculateSubtotal(state.cart));
      const automaticDiscount = calculateBestDiscount(state.cart, state.promotions, state.comboRules);
      const appliedDiscount = Math.min(calculateSubtotal(state.cart), Math.max(safeDiscount, automaticDiscount, options.discountOverride ?? 0));
      const totalAmount = calculateTotal(state.cart, appliedDiscount);
      const method = options.paymentMethod ?? "cash";
      const customer = options.customerId ? state.customers.find((item) => item.id === options.customerId) : undefined;
      const debtAmount = customer && method === "debt" ? Math.min(totalAmount, Math.max(0, options.debtAmount ?? totalAmount)) : 0;
      const order: Order = { id: `HD-${String(Date.now()).slice(-6)}`, createdAt: new Date().toISOString(), items: state.cart.map((item) => ({ productId: item.productId, name: item.name, quantity: item.quantity, unit: item.unit, priceAtSale: item.price })), subtotal: calculateSubtotal(state.cart), discount: appliedDiscount, totalAmount, paymentMethod: method, customerId: customer?.id, customerName: customer?.name, amountReceived: totalAmount - debtAmount, debtAmount, sellerUserId: options.sellerUserId, sellerName: options.sellerName };
      const activities = state.products.flatMap((product) => { const soldBase = state.cart.filter((item) => item.productId === product.id).reduce((sum, item) => sum + item.quantity * (item.conversionToBase ?? 1), 0); return soldBase ? [createActivity(product, "sale", product.stockQuantity, -soldBase, `Bán hàng ${order.id}`)] : []; });
      const debtTransaction = debtAmount && customer ? createDebtTransaction(customer, "charge", debtAmount, `Ghi nợ từ ${order.id}`, order.id) : undefined;
      dispatch({ type: "CHECKOUT", payload: { order, activities, debtTransaction } });
      if (method === "bank_transfer") dispatch({ type: "RECONCILE_TRANSFER", payload: { id: `transfer-${Date.now()}`, orderId: order.id, amountExpected: order.totalAmount, status: "pending", createdAt: order.createdAt } });
      return order;
    },
    getProductByBarcode: (barcode) => state.products.find((product) => product.barcode === barcode),
    replaceRemoteSnapshot: (products, orders) => dispatch({ type: "REPLACE_REMOTE_SNAPSHOT", payload: { products, orders } }),
    replaceRemoteState: (payload) => dispatch({ type: "REPLACE_REMOTE_STATE", payload }),
    importProducts: (drafts) => { const imported = importProductsIntoCatalog(state.products, drafts); const activities = imported.products.flatMap((product) => { const previous = state.products.find((candidate) => candidate.id === product.id); if (!previous) return [createActivity(product, "import", 0, product.stockQuantity, "Nhập từ tệp Excel/CSV")]; const change = product.stockQuantity - previous.stockQuantity; return change !== 0 ? [createActivity(product, "import", previous.stockQuantity, change, "Cập nhật từ tệp Excel/CSV")] : []; }); dispatch({ type: "IMPORT_PRODUCTS", payload: imported.products, activities }); return { added: imported.added, updated: imported.updated }; },
    adjustStock: (productId, quantityChange, note) => { const product = state.products.find((candidate) => candidate.id === productId); if (!product || !quantityChange) return; const safeChange = Math.max(-product.stockQuantity, Math.trunc(quantityChange)); dispatch({ type: "ADJUST_STOCK", productId, quantityChange: safeChange, activity: createActivity(product, "adjustment", product.stockQuantity, safeChange, note || "Điều chỉnh tồn kho") }); },
    addCustomer: (draft) => { const timestamp = new Date().toISOString(); const customer = { id: `cus-${Date.now()}`, name: draft.name.trim(), phone: draft.phone?.trim() || undefined, note: draft.note?.trim() || undefined, createdAt: timestamp, updatedAt: timestamp }; dispatch({ type: "ADD_CUSTOMER", payload: customer }); return customer; },
    updateCustomer: (id, draft) => dispatch({ type: "UPDATE_CUSTOMER", id, payload: draft }),
    recordDebtPayment: (customerId, amount, note) => { const customer = state.customers.find((item) => item.id === customerId); if (!customer || amount <= 0) return; dispatch({ type: "ADD_DEBT_TRANSACTION", payload: createDebtTransaction(customer, "payment", amount, note || "Khách trả nợ") }); },
    savePaymentSettings: (settings) => dispatch({ type: "SAVE_PAYMENT_SETTINGS", payload: { bankBin: settings.bankBin.replace(/\D/g, ""), accountNumber: settings.accountNumber.replace(/\D/g, ""), accountName: settings.accountName.trim() } }),
    addSupplier: (draft) => { const supplier: Supplier = { id: `sup-${Date.now()}`, name: draft.name.trim(), phone: draft.phone?.trim() || undefined, address: draft.address?.trim() || undefined, openingBalance: Math.max(0, draft.openingBalance ?? 0), createdAt: new Date().toISOString() }; dispatch({ type: "ADD_SUPPLIER", payload: supplier }); return supplier; },
    recordStockReceipt: (input) => {
      if (!input.items.length) return null;
      const timestamp = new Date().toISOString();
      const safeItems = input.items.filter((item) => item.quantity > 0 && item.unitCost >= 0).map((item) => ({ ...item, quantity: Math.trunc(item.quantity), unitCost: Math.round(item.unitCost) }));
      if (!safeItems.length) return null;
      const receipt: StockReceipt = { id: `PN-${String(Date.now()).slice(-6)}`, supplierId: input.supplierId, supplierName: input.supplierName, items: safeItems, totalAmount: safeItems.reduce((sum, item) => sum + item.quantity * item.unitCost, 0), paidAmount: Math.min(Math.max(0, Math.round(input.paidAmount)), safeItems.reduce((sum, item) => sum + item.quantity * item.unitCost, 0)), debtAmount: 0, note: input.note?.trim() || undefined, createdAt: timestamp };
      receipt.debtAmount = receipt.totalAmount - receipt.paidAmount;
      const nextProducts = state.products.map((product) => { const received = safeItems.find((item) => item.productId === product.id); if (!received) return product; const previousStock = product.stockQuantity; const previousCost = product.costPrice ?? 0; const nextCost = Math.round(((previousStock * previousCost) + (received.quantity * received.unitCost)) / Math.max(previousStock + received.quantity, 1)); return { ...product, stockQuantity: previousStock + received.quantity, costPrice: nextCost, updatedAt: timestamp }; });
      const activities = safeItems.map((item) => { const product = state.products.find((candidate) => candidate.id === item.productId); return product ? createActivity(product, "receipt", product.stockQuantity, item.quantity, `Phiếu nhập ${receipt.id}${receipt.supplierName ? ` · ${receipt.supplierName}` : ""}`) : null; }).filter((item): item is InventoryActivity => Boolean(item));
      const expiryBatches = safeItems.filter((item) => item.expiresAt).map((item) => ({ id: `exp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, productId: item.productId, quantity: item.quantity, expiresAt: item.expiresAt as string, createdAt: timestamp }));
      dispatch({ type: "RECORD_STOCK_RECEIPT", payload: { receipt, products: nextProducts, activities, expiryBatches } });
      return receipt;
    },
    addExpiryBatch: (batch) => dispatch({ type: "ADD_EXPIRY_BATCH", payload: { ...batch, id: `exp-${Date.now()}`, createdAt: new Date().toISOString() } }),
    closeShift: (actualCash, note) => { const today = new Date(); const todayOrders = state.orders.filter((order) => new Date(order.createdAt).toDateString() === today.toDateString()); const cashRevenue = todayOrders.filter((order) => (order.paymentMethod ?? "cash") === "cash").reduce((sum, order) => sum + (order.amountReceived ?? order.totalAmount), 0); const shift: Shift = { id: `shift-${Date.now()}`, openedAt: new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString(), closedAt: new Date().toISOString(), openingCash: 0, expectedCash: cashRevenue, actualCash: Math.max(0, Math.round(actualCash)), cashDifference: Math.round(actualCash - cashRevenue), totalRevenue: todayOrders.reduce((sum, order) => sum + order.totalAmount, 0), orderCount: todayOrders.length, note: note?.trim() || undefined }; dispatch({ type: "CLOSE_SHIFT", payload: shift }); return shift; },
    recordSupplierPayment: (supplierId, amount, note) => { const supplier = state.suppliers.find((item) => item.id === supplierId); if (!supplier || amount <= 0) return null; const payment: SupplierPayment = { id: `suppay-${Date.now()}`, supplierId, amount: Math.round(amount), note: note?.trim() || "Thanh toán công nợ nhà cung cấp", createdAt: new Date().toISOString() }; dispatch({ type: "ADD_SUPPLIER_PAYMENT", payload: payment }); return payment; },
    reconcileTransfer: (orderId, input) => { const order = state.orders.find((item) => item.id === orderId && item.paymentMethod === "bank_transfer"); if (!order) return null; const amountConfirmed = input.amountConfirmed ?? order.totalAmount; if (input.status === "confirmed" && amountConfirmed < order.totalAmount) return null; const reconciliation: PaymentReconciliation = { id: `transfer-${Date.now()}`, orderId, amountExpected: order.totalAmount, amountConfirmed, status: input.status, reference: input.reference?.trim() || undefined, note: input.note?.trim() || undefined, createdAt: new Date().toISOString(), confirmedAt: input.status === "confirmed" ? new Date().toISOString() : undefined }; dispatch({ type: "RECONCILE_TRANSFER", payload: reconciliation }); return reconciliation; },
    addPromotion: (promotion) => { const item: Promotion = { ...promotion, id: `promo-${Date.now()}`, value: Math.max(0, promotion.value), createdAt: new Date().toISOString() }; dispatch({ type: "ADD_PROMOTION", payload: item }); return item; },
    addComboRule: (combo) => { const item: ComboRule = { ...combo, id: `combo-${Date.now()}`, requiredQuantity: Math.max(1, Math.trunc(combo.requiredQuantity)), comboPrice: Math.max(0, Math.round(combo.comboPrice)), createdAt: new Date().toISOString() }; dispatch({ type: "ADD_COMBO_RULE", payload: item }); return item; },
    getPersistedState: () => { const { initialized, ...payload } = state; return payload; },
    restorePersistedState: (payload) => dispatch({ type: "HYDRATE", payload: { ...payload, cart: [], inventoryActivities: payload.inventoryActivities ?? [], customers: payload.customers ?? [], debtTransactions: payload.debtTransactions ?? [], paymentSettings: payload.paymentSettings ?? emptyPaymentSettings, paymentReconciliations: payload.paymentReconciliations ?? [], promotions: payload.promotions ?? [], comboRules: payload.comboRules ?? [] } }),
  }), [state]);
  return <PosContext.Provider value={value}>{children}</PosContext.Provider>;
}

function createActivity(product: Product, type: InventoryActivityType, quantityBefore: number, quantityChange: number, note: string): InventoryActivity { return { id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, productId: product.id, productName: product.name, type, quantityBefore, quantityChange, quantityAfter: Math.max(0, quantityBefore + quantityChange), note, createdAt: new Date().toISOString() }; }
function createDebtTransaction(customer: Customer, type: DebtTransaction["type"], amount: number, note: string, orderId?: string): DebtTransaction { return { id: `debt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, customerId: customer.id, customerName: customer.name, type, amount: Math.round(amount), note, orderId, createdAt: new Date().toISOString() }; }

export function usePosStore() { const context = useContext(PosContext); if (!context) throw new Error("usePosStore phải được dùng bên trong PosStoreProvider"); return context; }
