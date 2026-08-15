import { createContext, type ReactNode, useContext, useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { usePosStore } from "@/lib/pos-store";
import { workspaceBelongsToUser } from "@/lib/cloud-sync-guard";
import type { ComboRule, Customer, DebtTransaction, ExpiryBatch, InventoryActivity, Order, PaymentReconciliation, PaymentSettings, Product, Promotion, Shift, StockReceipt, Supplier, SupplierPayment } from "@/lib/pos-types";

type CloudSnapshot = {
  products: Product[];
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
    suppliers: state.suppliers,
    stockReceipts: state.stockReceipts,
    supplierPayments: state.supplierPayments,
    expiryBatches: state.expiryBatches,
    shifts: state.shifts,
    paymentReconciliations: state.paymentReconciliations,
    promotions: state.promotions,
    comboRules: state.comboRules,
  };
}

function snapshotSignature(snapshot: CloudSnapshot) {
  return JSON.stringify(snapshot);
}

export function CloudSyncProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { initialized, products, orders, inventoryActivities, customers, debtTransactions, paymentSettings, suppliers, stockReceipts, supplierPayments, expiryBatches, shifts, paymentReconciliations, promotions, comboRules, replaceRemoteState } = usePosStore();
  const workspaceQuery = trpc.workspace.me.useQuery(undefined, { enabled: isAuthenticated && initialized, retry: false });
  const activeWorkspace = workspaceBelongsToUser(workspaceQuery.data, user?.id);
  const snapshotQuery = trpc.workspace.snapshot.get.useQuery(undefined, { enabled: isAuthenticated && initialized && activeWorkspace, retry: false });
  const pushSnapshot = trpc.workspace.snapshot.push.useMutation();
  const [syncError, setSyncError] = useState<string | null>(null);
  const [remoteReady, setRemoteReady] = useState(false);
  const [status, setStatus] = useState<CloudSyncStatus>("local");
  const latestSignature = useRef("");
  const remoteVersion = useRef(0);
  const skipFirstPush = useRef(true);

  const localSnapshot = useMemo(() => toSnapshot({ products, orders, inventoryActivities, customers, debtTransactions, paymentSettings, suppliers, stockReceipts, supplierPayments, expiryBatches, shifts, paymentReconciliations, promotions, comboRules }), [comboRules, customers, debtTransactions, expiryBatches, inventoryActivities, orders, paymentReconciliations, paymentSettings, products, promotions, shifts, stockReceipts, supplierPayments, suppliers]);

  useEffect(() => {
    if (authLoading || !isAuthenticated || !initialized || !activeWorkspace) {
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
          suppliers: remote.suppliers ?? [],
          stockReceipts: remote.stockReceipts ?? [],
          supplierPayments: remote.supplierPayments ?? [],
          expiryBatches: remote.expiryBatches ?? [],
          shifts: remote.shifts ?? [],
          paymentReconciliations: remote.paymentReconciliations ?? [],
          promotions: remote.promotions ?? [],
          comboRules: remote.comboRules ?? [],
        };
        replaceRemoteState({ ...hydrated, cart: [] });
        latestSignature.current = snapshotSignature(hydrated);
        remoteVersion.current = snapshotQuery.data?.version ?? 0;
      } else {
        latestSignature.current = snapshotSignature(localSnapshot);
        remoteVersion.current = snapshotQuery.data?.version ?? 0;
      }
      skipFirstPush.current = true;
      setRemoteReady(true);
      setSyncError(null);
      setStatus("synced");
    }
  }, [activeWorkspace, authLoading, initialized, isAuthenticated, localSnapshot, remoteReady, replaceRemoteState, snapshotQuery.data, snapshotQuery.error, snapshotQuery.isLoading, workspaceQuery.error, workspaceQuery.isLoading]);

  useEffect(() => {
    if (!remoteReady || !isAuthenticated || !initialized || !activeWorkspace) return;
    const nextSignature = snapshotSignature(localSnapshot);
    if (skipFirstPush.current) {
      skipFirstPush.current = false;
      latestSignature.current = nextSignature;
      return;
    }
    if (nextSignature === latestSignature.current) return;
    const timer = setTimeout(() => {
      setStatus("syncing");
      pushSnapshot.mutate({ snapshot: localSnapshot, clientVersion: remoteVersion.current }, {
        onSuccess: (result) => { latestSignature.current = nextSignature; remoteVersion.current = result.version; setSyncError(null); setStatus("synced"); },
        onError: (error) => {
          if (error.data?.code === "CONFLICT") setSyncError("Cloud vừa được cập nhật trên thiết bị khác. Hãy làm mới để tải bản mới trước khi tiếp tục.");
          else setSyncError("Không thể đồng bộ lên cloud. Dữ liệu trên máy vẫn được giữ nguyên.");
          setStatus("error");
        },
      });
    }, 900);
    return () => clearTimeout(timer);
  }, [activeWorkspace, initialized, isAuthenticated, localSnapshot, pushSnapshot, remoteReady]);

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
