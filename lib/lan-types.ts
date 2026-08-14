export type LanConnection = {
  serverUrl: string;
  token: string;
  serverName: string;
  connectedAt: string;
};

export type LanPairingData = {
  serverUrl: string;
  code: string;
};

export type LanSnapshot<TProduct, TOrder> = {
  products: TProduct[];
  orders: TOrder[];
  updatedAt: string;
  state?: Record<string, unknown>;
};

export function normalizeLanServerUrl(value: string) {
  const withProtocol = /^https?:\/\//i.test(value.trim()) ? value.trim() : `http://${value.trim()}`;
  return withProtocol.replace(/\/+$/, "");
}

export function parseLanPairingPayload(payload: string): LanPairingData | null {
  try {
    const url = new URL(payload);
    if (url.protocol !== "taphoa-pos:" || url.hostname !== "lan-connect") return null;
    const server = url.searchParams.get("server");
    const code = url.searchParams.get("code");
    if (!server || !code) return null;
    return { serverUrl: normalizeLanServerUrl(server), code };
  } catch {
    return null;
  }
}
