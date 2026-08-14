import type { Order, Product } from "@/lib/pos-types";
import { normalizeLanServerUrl, type LanConnection, type LanSnapshot } from "@/lib/lan-types";

type RequestOptions = { method?: "GET" | "POST" | "PUT" | "DELETE"; token?: string; body?: unknown };

async function lanRequest<T>(serverUrl: string, path: string, options: RequestOptions = {}) {
  const response = await fetch(`${normalizeLanServerUrl(serverUrl)}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { "X-Device-Token": options.token } : {}),
    },
    ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "Không thể kết nối máy chủ LAN.");
  return data as T;
}

export async function pairLanServer(serverUrl: string, code: string): Promise<LanConnection> {
  const normalizedUrl = normalizeLanServerUrl(serverUrl);
  const result = await lanRequest<{ token: string; serverUrl: string; serverName: string }>(normalizedUrl, "/pair", { method: "POST", body: { code: code.trim().toUpperCase() } });
  return { serverUrl: normalizeLanServerUrl(result.serverUrl), token: result.token, serverName: result.serverName, connectedAt: new Date().toISOString() };
}

export function getLanSnapshot(connection: LanConnection) {
  return lanRequest<LanSnapshot<Product, Order>>(connection.serverUrl, "/snapshot", { token: connection.token });
}

export function putLanProduct(connection: LanConnection, product: Product) {
  return lanRequest<{ ok: true }>(connection.serverUrl, `/products/${encodeURIComponent(product.id)}`, { method: "PUT", token: connection.token, body: product });
}

export function deleteLanProduct(connection: LanConnection, productId: string) {
  return lanRequest<{ ok: true }>(connection.serverUrl, `/products/${encodeURIComponent(productId)}`, { method: "DELETE", token: connection.token });
}

export function postLanOrder(connection: LanConnection, order: Order) {
  return lanRequest<{ ok: true }>(connection.serverUrl, "/orders", { method: "POST", token: connection.token, body: order });
}

export function putLanState(connection: LanConnection, state: Record<string, unknown>) {
  return lanRequest<{ ok: true; updatedAt: string }>(connection.serverUrl, "/state", { method: "PUT", token: connection.token, body: state });
}

export function getLanWebSocketUrl(connection: LanConnection) {
  const url = new URL(connection.serverUrl);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/ws";
  url.searchParams.set("token", connection.token);
  return url.toString();
}
