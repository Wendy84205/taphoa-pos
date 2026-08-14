import AsyncStorage from "@react-native-async-storage/async-storage";
import { calculateSubtotal, calculateTotal } from "@/lib/pos-calculations";
import { importProductsIntoCatalog } from "@/lib/product-import";
import type { CartItem, InventoryActivity, InventoryActivityType, Order, Product, ProductDraft } from "@/lib/pos-types";
import { createContext, ReactNode, useContext, useEffect, useMemo, useReducer } from "react";

const STORAGE_KEY = "taphoa-pos-v1";

type PosState = {
  initialized: boolean;
  products: Product[];
  cart: CartItem[];
  orders: Order[];
  inventoryActivities: InventoryActivity[];
};

type PersistedState = Omit<PosState, "initialized">;

type PosContextValue = PosState & {
  addProduct: (draft: ProductDraft) => void;
  updateProduct: (id: string, draft: ProductDraft) => void;
  deleteProduct: (id: string) => void;
  addToCart: (product: Product) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  checkout: (discount: number) => Order | null;
  getProductByBarcode: (barcode: string) => Product | undefined;
  replaceRemoteSnapshot: (products: Product[], orders: Order[]) => void;
  importProducts: (drafts: ProductDraft[]) => { added: number; updated: number };
  adjustStock: (productId: string, quantityChange: number, note: string) => void;
};

type Action =
  | { type: "HYDRATE"; payload: PersistedState }
  | { type: "ADD_PRODUCT"; payload: Product; activity: InventoryActivity }
  | { type: "UPDATE_PRODUCT"; id: string; payload: ProductDraft; activity?: InventoryActivity }
  | { type: "DELETE_PRODUCT"; id: string }
  | { type: "ADD_TO_CART"; payload: Product }
  | { type: "UPDATE_CART_QUANTITY"; productId: string; quantity: number }
  | { type: "REMOVE_FROM_CART"; productId: string }
  | { type: "CLEAR_CART" }
  | { type: "CHECKOUT"; payload: { order: Order; activities: InventoryActivity[] } }
  | { type: "REPLACE_REMOTE_SNAPSHOT"; payload: { products: Product[]; orders: Order[] } }
  | { type: "IMPORT_PRODUCTS"; payload: Product[]; activities: InventoryActivity[] }
  | { type: "ADJUST_STOCK"; productId: string; quantityChange: number; activity: InventoryActivity };

const now = new Date().toISOString();
const seedProducts: Product[] = [
  { id: "p-1", name: "Nước suối Lavie 500ml", price: 7000, costPrice: 5000, unit: "chai", category: "Nước giải khát", barcode: "8934588012225", stockQuantity: 24, lowStockThreshold: 6, createdAt: now, updatedAt: now },
  { id: "p-2", name: "Coca-Cola lon", price: 12000, costPrice: 9000, unit: "lon", category: "Nước giải khát", barcode: "8935049500488", stockQuantity: 18, lowStockThreshold: 8, createdAt: now, updatedAt: now },
  { id: "p-3", name: "Mì Hảo Hảo tôm chua cay", price: 4500, costPrice: 3600, unit: "gói", category: "Thực phẩm", barcode: "8934563651075", stockQuantity: 40, lowStockThreshold: 12, createdAt: now, updatedAt: now },
  { id: "p-4", name: "Bánh Oreo vị vani", price: 9000, costPrice: 7000, unit: "gói", category: "Bánh kẹo", barcode: "8934605010231", stockQuantity: 7, lowStockThreshold: 8, createdAt: now, updatedAt: now },
  { id: "p-5", name: "Nước mắm Nam Ngư 500ml", price: 28000, costPrice: 23000, unit: "chai", category: "Gia vị", barcode: "8934687003343", stockQuantity: 10, lowStockThreshold: 4, createdAt: now, updatedAt: now },
  { id: "p-6", name: "Trứng gà tươi", price: 3500, costPrice: 2800, unit: "quả", category: "Thực phẩm", stockQuantity: 52, lowStockThreshold: 15, createdAt: now, updatedAt: now },
];

const initialState: PosState = { initialized: false, products: seedProducts, cart: [], orders: [], inventoryActivities: [] };
const PosContext = createContext<PosContextValue | null>(null);

function reducer(state: PosState, action: Action): PosState {
  switch (action.type) {
    case "HYDRATE":
      return { initialized: true, products: action.payload.products, cart: action.payload.cart, orders: action.payload.orders, inventoryActivities: action.payload.inventoryActivities ?? [] };
    case "ADD_PRODUCT":
      return { ...state, products: [action.payload, ...state.products], inventoryActivities: [action.activity, ...state.inventoryActivities] };
    case "UPDATE_PRODUCT":
      return {
        ...state,
        products: state.products.map((product) => product.id === action.id ? { ...product, ...action.payload, updatedAt: new Date().toISOString() } : product),
        inventoryActivities: action.activity ? [action.activity, ...state.inventoryActivities] : state.inventoryActivities,
      };
    case "DELETE_PRODUCT":
      return { ...state, products: state.products.filter((product) => product.id !== action.id), cart: state.cart.filter((item) => item.productId !== action.id) };
    case "ADD_TO_CART": {
      const existing = state.cart.find((item) => item.productId === action.payload.id);
      if (existing) return { ...state, cart: state.cart.map((item) => item.productId === action.payload.id ? { ...item, quantity: Math.min(item.quantity + 1, item.stockQuantity) } : item) };
      if (action.payload.stockQuantity <= 0) return state;
      return { ...state, cart: [...state.cart, { productId: action.payload.id, name: action.payload.name, price: action.payload.price, unit: action.payload.unit, quantity: 1, stockQuantity: action.payload.stockQuantity }] };
    }
    case "UPDATE_CART_QUANTITY":
      return { ...state, cart: state.cart.map((item) => item.productId === action.productId ? { ...item, quantity: Math.min(Math.max(0, action.quantity), item.stockQuantity) } : item).filter((item) => item.quantity > 0) };
    case "REMOVE_FROM_CART":
      return { ...state, cart: state.cart.filter((item) => item.productId !== action.productId) };
    case "CLEAR_CART":
      return { ...state, cart: [] };
    case "CHECKOUT":
      return {
        ...state,
        orders: [action.payload.order, ...state.orders],
        cart: [],
        inventoryActivities: [...action.payload.activities, ...state.inventoryActivities],
        products: state.products.map((product) => {
          const sold = state.cart.find((item) => item.productId === product.id);
          return sold ? { ...product, stockQuantity: Math.max(0, product.stockQuantity - sold.quantity), updatedAt: new Date().toISOString() } : product;
        }),
      };
    case "REPLACE_REMOTE_SNAPSHOT":
      return { ...state, products: action.payload.products, orders: action.payload.orders };
    case "IMPORT_PRODUCTS":
      return { ...state, products: action.payload, inventoryActivities: [...action.activities, ...state.inventoryActivities] };
    case "ADJUST_STOCK":
      return {
        ...state,
        products: state.products.map((product) => product.id === action.productId ? { ...product, stockQuantity: Math.max(0, product.stockQuantity + action.quantityChange), updatedAt: new Date().toISOString() } : product),
        inventoryActivities: [action.activity, ...state.inventoryActivities],
      };
    default:
      return state;
  }
}

export function PosStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (!raw) { dispatch({ type: "HYDRATE", payload: { products: seedProducts, cart: [], orders: [], inventoryActivities: [] } }); return; }
      const saved = JSON.parse(raw) as PersistedState;
      dispatch({ type: "HYDRATE", payload: { ...saved, inventoryActivities: saved.inventoryActivities ?? [] } });
    }).catch(() => dispatch({ type: "HYDRATE", payload: { products: seedProducts, cart: [], orders: [], inventoryActivities: [] } }));
  }, []);

  useEffect(() => {
    if (!state.initialized) return;
    const payload: PersistedState = { products: state.products, cart: state.cart, orders: state.orders, inventoryActivities: state.inventoryActivities };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload)).catch(() => undefined);
  }, [state]);

  const value = useMemo<PosContextValue>(() => ({
    ...state,
    addProduct: (draft) => {
      const timestamp = new Date().toISOString();
      const product = { ...draft, id: `p-${Date.now()}`, createdAt: timestamp, updatedAt: timestamp };
      dispatch({ type: "ADD_PRODUCT", payload: product, activity: createActivity(product, "initial", 0, product.stockQuantity, "Tạo sản phẩm mới") });
    },
    updateProduct: (id, draft) => {
      const previous = state.products.find((product) => product.id === id);
      const quantityChange = previous ? draft.stockQuantity - previous.stockQuantity : 0;
      const activity = previous && quantityChange !== 0 ? createActivity(previous, "adjustment", previous.stockQuantity, quantityChange, "Điều chỉnh tồn khi sửa sản phẩm") : undefined;
      dispatch({ type: "UPDATE_PRODUCT", id, payload: draft, activity });
    },
    deleteProduct: (id) => dispatch({ type: "DELETE_PRODUCT", id }),
    addToCart: (product) => dispatch({ type: "ADD_TO_CART", payload: product }),
    updateCartQuantity: (productId, quantity) => dispatch({ type: "UPDATE_CART_QUANTITY", productId, quantity }),
    removeFromCart: (productId) => dispatch({ type: "REMOVE_FROM_CART", productId }),
    clearCart: () => dispatch({ type: "CLEAR_CART" }),
    checkout: (discount) => {
      if (!state.cart.length) return null;
      const safeDiscount = Math.min(Math.max(0, discount), calculateSubtotal(state.cart));
      const order: Order = { id: `HD-${String(Date.now()).slice(-6)}`, createdAt: new Date().toISOString(), items: state.cart.map((item) => ({ productId: item.productId, name: item.name, quantity: item.quantity, unit: item.unit, priceAtSale: item.price })), subtotal: calculateSubtotal(state.cart), discount: safeDiscount, totalAmount: calculateTotal(state.cart, safeDiscount) };
      const activities = state.cart.map((item) => {
        const product = state.products.find((candidate) => candidate.id === item.productId)!;
        return createActivity(product, "sale", product.stockQuantity, -item.quantity, `Bán hàng ${order.id}`);
      });
      dispatch({ type: "CHECKOUT", payload: { order, activities } });
      return order;
    },
    getProductByBarcode: (barcode) => state.products.find((product) => product.barcode === barcode),
    replaceRemoteSnapshot: (products, orders) => dispatch({ type: "REPLACE_REMOTE_SNAPSHOT", payload: { products, orders } }),
    importProducts: (drafts) => {
      const imported = importProductsIntoCatalog(state.products, drafts);
      const activities = imported.products.flatMap((product) => {
        const previous = state.products.find((candidate) => candidate.id === product.id);
        if (!previous) return [createActivity(product, "import", 0, product.stockQuantity, "Nhập từ tệp Excel/CSV")];
        const change = product.stockQuantity - previous.stockQuantity;
        return change !== 0 ? [createActivity(product, "import", previous.stockQuantity, change, "Cập nhật từ tệp Excel/CSV")] : [];
      });
      dispatch({ type: "IMPORT_PRODUCTS", payload: imported.products, activities });
      return { added: imported.added, updated: imported.updated };
    },
    adjustStock: (productId, quantityChange, note) => {
      const product = state.products.find((candidate) => candidate.id === productId);
      if (!product || !quantityChange) return;
      const safeChange = Math.max(-product.stockQuantity, Math.trunc(quantityChange));
      dispatch({ type: "ADJUST_STOCK", productId, quantityChange: safeChange, activity: createActivity(product, "adjustment", product.stockQuantity, safeChange, note || "Điều chỉnh tồn kho") });
    },
  }), [state]);

  return <PosContext.Provider value={value}>{children}</PosContext.Provider>;
}

function createActivity(product: Product, type: InventoryActivityType, quantityBefore: number, quantityChange: number, note: string): InventoryActivity {
  return { id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, productId: product.id, productName: product.name, type, quantityBefore, quantityChange, quantityAfter: Math.max(0, quantityBefore + quantityChange), note, createdAt: new Date().toISOString() };
}

export function usePosStore() {
  const context = useContext(PosContext);
  if (!context) throw new Error("usePosStore phải được dùng bên trong PosStoreProvider");
  return context;
}
