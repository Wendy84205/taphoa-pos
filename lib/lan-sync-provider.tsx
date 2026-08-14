import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { deleteLanProduct, getLanSnapshot, getLanWebSocketUrl, pairLanServer, postLanOrder, putLanProduct } from "@/lib/lan-client";
import type { LanConnection, LanPairingData } from "@/lib/lan-types";
import { usePosStore } from "@/lib/pos-store";
import type { Order, Product } from "@/lib/pos-types";

const STORAGE_KEY = "taphoa-pos-lan-connection-v1";

type LanContextValue = {
  loading: boolean;
  syncing: boolean;
  connection: LanConnection | null;
  lastError: string | null;
  connect: (pairing: LanPairingData) => Promise<void>;
  refresh: () => Promise<void>;
  disconnect: () => Promise<void>;
};

const LanContext = createContext<LanContextValue | null>(null);

function toProductMap(products: Product[]) { return new Map(products.map((product) => [product.id, JSON.stringify(product)])); }
function toOrderMap(orders: Order[]) { return new Map(orders.map((order) => [order.id, JSON.stringify(order)])); }

export function LanSyncProvider({ children }: { children: ReactNode }) {
  const { products, orders, initialized, replaceRemoteSnapshot } = usePosStore();
  const [connection, setConnection] = useState<LanConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const previousProducts = useRef<Map<string, string>>(new Map());
  const previousOrders = useRef<Map<string, string>>(new Map());
  const socket = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectionRef = useRef<LanConnection | null>(null);
  const latestDataRef = useRef({ products, orders });
  const replaceSnapshotRef = useRef(replaceRemoteSnapshot);

  useEffect(() => {
    latestDataRef.current = { products, orders };
  }, [orders, products]);

  useEffect(() => {
    replaceSnapshotRef.current = replaceRemoteSnapshot;
  }, [replaceRemoteSnapshot]);

  const setBaseline = useCallback((nextProducts: Product[], nextOrders: Order[]) => {
    previousProducts.current = toProductMap(nextProducts);
    previousOrders.current = toOrderMap(nextOrders);
  }, []);

  const refresh = useCallback(async () => {
    const activeConnection = connectionRef.current;
    if (!activeConnection) return;
    setSyncing(true);
    try {
      const snapshot = await getLanSnapshot(activeConnection);
      setBaseline(snapshot.products, snapshot.orders);
      replaceSnapshotRef.current(snapshot.products, snapshot.orders);
      setLastError(null);
    } catch (error) {
      setLastError(error instanceof Error ? error.message : "Không thể đồng bộ dữ liệu LAN.");
      throw error;
    } finally {
      setSyncing(false);
    }
  }, [replaceRemoteSnapshot, setBaseline]);

  const closeSocket = useCallback(() => {
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    reconnectTimer.current = null;
    socket.current?.close();
    socket.current = null;
  }, []);

  const openSocket = useCallback((activeConnection: LanConnection) => {
    closeSocket();
    const client = new WebSocket(getLanWebSocketUrl(activeConnection));
    socket.current = client;
    client.onmessage = () => { refresh().catch(() => undefined); };
    client.onclose = () => {
      if (connectionRef.current?.token !== activeConnection.token) return;
      reconnectTimer.current = setTimeout(() => openSocket(activeConnection), 3500);
    };
    client.onerror = () => undefined;
  }, [closeSocket, refresh]);

  const connectToServer = useCallback(async (nextConnection: LanConnection) => {
    connectionRef.current = nextConnection;
    setConnection(nextConnection);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextConnection));
    const snapshot = await getLanSnapshot(nextConnection);
    const local = latestDataRef.current;
    if (snapshot.products.length === 0 && snapshot.orders.length === 0 && (local.products.length > 0 || local.orders.length > 0)) {
      for (const product of local.products) await putLanProduct(nextConnection, product);
      for (const order of local.orders) await postLanOrder(nextConnection, order);
      const uploaded = await getLanSnapshot(nextConnection);
      setBaseline(uploaded.products, uploaded.orders);
      replaceSnapshotRef.current(uploaded.products, uploaded.orders);
    } else {
      setBaseline(snapshot.products, snapshot.orders);
      replaceSnapshotRef.current(snapshot.products, snapshot.orders);
    }
    openSocket(nextConnection);
    setLastError(null);
  }, [openSocket, setBaseline]);

  const connect = useCallback(async (pairing: LanPairingData) => {
    setSyncing(true);
    try {
      const nextConnection = await pairLanServer(pairing.serverUrl, pairing.code);
      await connectToServer(nextConnection);
    } catch (error) {
      setLastError(error instanceof Error ? error.message : "Không thể ghép nối với laptop.");
      throw error;
    } finally {
      setSyncing(false);
    }
  }, [connectToServer]);

  const disconnect = useCallback(async () => {
    closeSocket();
    connectionRef.current = null;
    setConnection(null);
    setLastError(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, [closeSocket]);

  useEffect(() => {
    if (!initialized) return;
    AsyncStorage.getItem(STORAGE_KEY).then(async (raw) => {
      if (!raw) return;
      try { await connectToServer(JSON.parse(raw) as LanConnection); } catch { /* Trạng thái lỗi hiển thị trong tab Kết nối. */ }
    }).finally(() => setLoading(false));
    return closeSocket;
  }, [closeSocket, connectToServer, initialized]);

  useEffect(() => {
    const activeConnection = connectionRef.current;
    if (!activeConnection || !initialized) return;
    const nextProducts = toProductMap(products);
    const beforeProducts = previousProducts.current;
    products.filter((product) => beforeProducts.get(product.id) !== nextProducts.get(product.id)).forEach((product) => putLanProduct(activeConnection, product).catch((error) => setLastError(error.message)));
    Array.from(beforeProducts.keys()).filter((id) => !nextProducts.has(id)).forEach((id) => deleteLanProduct(activeConnection, id).catch((error) => setLastError(error.message)));
    previousProducts.current = nextProducts;
  }, [initialized, products]);

  useEffect(() => {
    const activeConnection = connectionRef.current;
    if (!activeConnection || !initialized) return;
    const nextOrders = toOrderMap(orders);
    const beforeOrders = previousOrders.current;
    orders.filter((order) => beforeOrders.get(order.id) !== nextOrders.get(order.id)).forEach((order) => postLanOrder(activeConnection, order).catch((error) => setLastError(error.message)));
    previousOrders.current = nextOrders;
  }, [initialized, orders]);

  const value = useMemo<LanContextValue>(() => ({ loading, syncing, connection, lastError, connect, refresh, disconnect }), [connect, connection, disconnect, lastError, loading, refresh, syncing]);
  return <LanContext.Provider value={value}>{children}</LanContext.Provider>;
}

export function useLanSync() {
  const context = useContext(LanContext);
  if (!context) throw new Error("useLanSync phải được dùng bên trong LanSyncProvider");
  return context;
}
