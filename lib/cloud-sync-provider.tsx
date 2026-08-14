import { createContext, type ReactNode, useContext, useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { usePosStore } from "@/lib/pos-store";
import type { Customer, DebtTransaction, InventoryActivity, Order, PaymentSettings, Product } from "@/lib/pos-types";

type CloudSnapshot = {
  products: Product[];
  orders: Order[];
  inventoryActivities: InventoryActivity[];
  customers: Customer[];
  debtTransactions: DebtTransaction[];
  paymentSettings: PaymentSettings;
};

type CloudSyncStatus = "local" | "loading" | "synced" | "syncing" | "error";
type CloudSyncContextValue = { status: CloudSyncStatus; error: string | null; storeName: string | null; role: "owner" | "staff" | null; refresh: () => Promise<void> };
const CloudSyncContext = createContext<CloudSyncContextValue | null>(null);

function toSnapshot(state: Pick<CloudSnapshot, keyof CloudSnapshot>): CloudSnapshot {
  return {
    products: state.products,
    orders: state.orders,
    inventoryActivities: state.inventoryActivities,
    customers: state.customers,
    debtTransactions: state.debtTransactions,
    paymentSettings: state.paymentSettings,
  };
}

function snapshotSignature(snapshot: CloudSnapshot) {
  return JSON.stringify(snapshot);
}

export function CloudSyncProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { initialized, products, orders, inventoryActivities, customers, debtTransactions, paymentSettings, replaceRemoteState } = usePosStore();
  const workspaceQuery = trpc.workspace.me.useQuery(undefined, { enabled: isAuthenticated && initialized, retry: false });
  const snapshotQuery = trpc.workspace.snapshot.get.useQuery(undefined, { enabled: isAuthenticated && initialized && Boolean(workspaceQuery.data), retry: false });
  const pushSnapshot = trpc.workspace.snapshot.push.useMutation();
  const [syncError, setSyncError] = useState<string | null>(null);
  const [remoteReady, setRemoteReady] = useState(false);
  const [status, setStatus] = useState<CloudSyncStatus>("local");
  const latestSignature = useRef("");
  const skipFirstPush = useRef(true);

  const localSnapshot = useMemo(() => toSnapshot({ products, orders, inventoryActivities, customers, debtTransactions, paymentSettings }), [customers, debtTransactions, inventoryActivities, orders, paymentSettings, products]);

  useEffect(() => {
    if (authLoading || !isAuthenticated || !initialized) {
      setRemoteReady(false);
      setStatus(isAuthenticated ? "loading" : "local");
      return;
    }
    if (workspaceQuery.isLoading || snapshotQuery.isLoading) {
      setStatus("loading");
      return;
    }
    if (workspaceQuery.error || snapshotQuery.error) {
      setSyncError("Chưa thể kết nối dữ liệu cloud; ứng dụng vẫn đang lưu trên máy này.");
      setStatus("error");
      setRemoteReady(true);
      return;
    }
    if (!remoteReady) {
      const remote = snapshotQuery.data?.snapshot as Partial<CloudSnapshot> | undefined;
      if (remote?.products && remote?.orders) {
        const hydrated: CloudSnapshot = {
          products: remote.products,
          orders: remote.orders,
          inventoryActivities: remote.inventoryActivities ?? [],
          customers: remote.customers ?? [],
          debtTransactions: remote.debtTransactions ?? [],
          paymentSettings: remote.paymentSettings ?? { bankBin: "", accountNumber: "", accountName: "" },
        };
        replaceRemoteState({ ...hydrated, cart: [] });
        latestSignature.current = snapshotSignature(hydrated);
      } else {
        latestSignature.current = snapshotSignature(localSnapshot);
      }
      skipFirstPush.current = true;
      setRemoteReady(true);
      setSyncError(null);
      setStatus("synced");
    }
  }, [authLoading, initialized, isAuthenticated, localSnapshot, remoteReady, replaceRemoteState, snapshotQuery.data, snapshotQuery.error, snapshotQuery.isLoading, workspaceQuery.error, workspaceQuery.isLoading]);

  useEffect(() => {
    if (!remoteReady || !isAuthenticated || !initialized) return;
    const nextSignature = snapshotSignature(localSnapshot);
    if (skipFirstPush.current) {
      skipFirstPush.current = false;
      latestSignature.current = nextSignature;
      return;
    }
    if (nextSignature === latestSignature.current) return;
    const timer = setTimeout(() => {
      setStatus("syncing");
      pushSnapshot.mutate({ snapshot: localSnapshot }, {
        onSuccess: () => { latestSignature.current = nextSignature; setSyncError(null); setStatus("synced"); },
        onError: () => { setSyncError("Không thể đồng bộ lên cloud. Dữ liệu trên máy vẫn được giữ nguyên."); setStatus("error"); },
      });
    }, 900);
    return () => clearTimeout(timer);
  }, [initialized, isAuthenticated, localSnapshot, pushSnapshot, remoteReady]);

  const value = useMemo<CloudSyncContextValue>(() => ({
    status: authLoading ? "loading" : status,
    error: syncError,
    storeName: workspaceQuery.data?.store.name ?? null,
    role: workspaceQuery.data?.membership.role ?? null,
    refresh: async () => { await workspaceQuery.refetch(); await snapshotQuery.refetch(); setRemoteReady(false); },
  }), [authLoading, snapshotQuery, status, syncError, workspaceQuery]);

  return <CloudSyncContext.Provider value={value}>{children}</CloudSyncContext.Provider>;
}

export function useCloudSync() {
  const value = useContext(CloudSyncContext);
  if (!value) throw new Error("useCloudSync phải được dùng bên trong CloudSyncProvider");
  return value;
}
