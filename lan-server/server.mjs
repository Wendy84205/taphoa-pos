import { randomBytes, randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { networkInterfaces } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

import QRCode from "qrcode";
import { WebSocketServer } from "ws";

const port = Number(process.env.PORT ?? 8765);
const host = "0.0.0.0";
const databaseFile = process.env.TAPHOA_DB ?? join(process.cwd(), "taphoa-pos-lan.sqlite");
const pairingCode = process.env.TAPHOA_PAIR_CODE ?? randomBytes(3).toString("hex").toUpperCase();
const sessions = new Set();
const db = new DatabaseSync(databaseFile);

db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    payload TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    payload TEXT NOT NULL,
    createdAt TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS pos_state (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    payload TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );
`);

function getLanAddress() {
  const interfaces = networkInterfaces();
  for (const addresses of Object.values(interfaces)) {
    for (const address of addresses ?? []) {
      if (address.family === "IPv4" && !address.internal) return address.address;
    }
  }
  return "127.0.0.1";
}

function publicUrl(request) {
  const forwardedHost = request.headers.host;
  return `http://${forwardedHost || `${getLanAddress()}:${port}`}`;
}

function snapshot() {
  const stateRow = db.prepare("SELECT payload, updatedAt FROM pos_state WHERE id = 1").get();
  const productRows = db.prepare("SELECT payload FROM products ORDER BY updatedAt DESC").all();
  const orderRows = db.prepare("SELECT payload FROM orders ORDER BY createdAt DESC").all();
  if (stateRow) {
    const state = JSON.parse(stateRow.payload);
    return { ...state, products: state.products ?? [], orders: state.orders ?? [], state, updatedAt: stateRow.updatedAt };
  }
  return { products: productRows.map((row) => JSON.parse(row.payload)), orders: orderRows.map((row) => JSON.parse(row.payload)), updatedAt: new Date().toISOString() };
}

function json(response, status, body) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, X-Device-Token",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  });
  response.end(JSON.stringify(body));
}

function isAuthorized(request) {
  const token = request.headers["x-device-token"];
  return typeof token === "string" && sessions.has(token);
}

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function broadcast(type, entityId) {
  const event = JSON.stringify({ type, entityId, at: new Date().toISOString() });
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) client.send(event);
  });
}

const server = createServer(async (request, response) => {
  if (request.method === "OPTIONS") return json(response, 204, {});
  const url = new URL(request.url ?? "/", publicUrl(request));

  try {
    if (request.method === "GET" && url.pathname === "/health") {
      return json(response, 200, { status: "ok", server: "Tạp Hóa POS LAN", databaseFile });
    }

    if (request.method === "GET" && url.pathname === "/pairing") {
      const baseUrl = publicUrl(request);
      const payload = `taphoa-pos://lan-connect?server=${encodeURIComponent(baseUrl)}&code=${pairingCode}`;
      const qrSvg = await QRCode.toString(payload, { type: "svg", margin: 1, color: { dark: "#1F7A4A", light: "#FFFFFF" } });
      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      return response.end(`<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Kết nối Tạp Hóa POS</title><style>body{font-family:system-ui;background:#f7f7f2;color:#1d2a23;margin:0;display:grid;min-height:100vh;place-items:center}.card{width:min(420px,90vw);padding:28px;background:#fff;border:1px solid #dfe5df;border-radius:24px;text-align:center}.card svg{width:230px;height:230px}.code{font:700 24px ui-monospace,monospace;letter-spacing:2px;color:#1f7a4a;background:#e9f3ea;padding:10px;border-radius:12px;margin:14px 0}.hint{color:#526158;line-height:1.55}</style></head><body><main class="card"><p style="font-weight:800;color:#1f7a4a;letter-spacing:1px">TẠP HÓA POS LAN</p><h1>Kết nối thiết bị</h1>${qrSvg}<p class="hint">Mở tab Kết nối trên điện thoại, quét mã QR hoặc nhập địa chỉ và mã ghép dưới đây.</p><div class="code">${pairingCode}</div><p class="hint">Địa chỉ máy chủ: ${baseUrl}</p></main></body></html>`);
    }

    if (request.method === "POST" && url.pathname === "/pair") {
      const body = await readJson(request);
      if (body.code !== pairingCode) return json(response, 403, { error: "Mã ghép thiết bị không đúng." });
      const token = randomUUID();
      sessions.add(token);
      return json(response, 200, { token, serverUrl: publicUrl(request), serverName: "Laptop tại quán" });
    }

    if (!isAuthorized(request)) return json(response, 401, { error: "Thiết bị chưa được ghép nối." });

    if (request.method === "GET" && url.pathname === "/snapshot") return json(response, 200, snapshot());

    if (request.method === "PUT" && url.pathname === "/state") {
      const state = await readJson(request);
      if (!state || !Array.isArray(state.products) || !Array.isArray(state.orders)) return json(response, 400, { error: "Snapshot POS không hợp lệ." });
      const updatedAt = new Date().toISOString();
      db.prepare("INSERT INTO pos_state (id, payload, updatedAt) VALUES (1, ?, ?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload, updatedAt=excluded.updatedAt").run(JSON.stringify(state), updatedAt);
      broadcast("state.changed", "pos");
      return json(response, 200, { ok: true, updatedAt });
    }

    if (request.method === "PUT" && url.pathname.startsWith("/products/")) {
      const product = await readJson(request);
      const id = decodeURIComponent(url.pathname.slice("/products/".length));
      if (!product?.name || product.id !== id) return json(response, 400, { error: "Dữ liệu sản phẩm không hợp lệ." });
      db.prepare("INSERT INTO products (id, payload, updatedAt) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload, updatedAt=excluded.updatedAt").run(id, JSON.stringify(product), product.updatedAt ?? new Date().toISOString());
      broadcast("product.changed", id);
      return json(response, 200, { ok: true });
    }

    if (request.method === "DELETE" && url.pathname.startsWith("/products/")) {
      const id = decodeURIComponent(url.pathname.slice("/products/".length));
      db.prepare("DELETE FROM products WHERE id = ?").run(id);
      broadcast("product.deleted", id);
      return json(response, 200, { ok: true });
    }

    if (request.method === "POST" && url.pathname === "/orders") {
      const order = await readJson(request);
      if (!order?.id || !Array.isArray(order.items)) return json(response, 400, { error: "Dữ liệu hóa đơn không hợp lệ." });
      db.prepare("INSERT INTO orders (id, payload, createdAt) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload, createdAt=excluded.createdAt").run(order.id, JSON.stringify(order), order.createdAt ?? new Date().toISOString());
      broadcast("order.created", order.id);
      return json(response, 201, { ok: true });
    }

    return json(response, 404, { error: "Không tìm thấy đường dẫn." });
  } catch (error) {
    console.error(error);
    return json(response, 500, { error: "Máy chủ không thể xử lý yêu cầu." });
  }
});

const wss = new WebSocketServer({ noServer: true });
server.on("upgrade", (request, socket, head) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host}`);
  if (url.pathname !== "/ws" || !sessions.has(url.searchParams.get("token") ?? "")) return socket.destroy();
  wss.handleUpgrade(request, socket, head, (client) => {
    wss.emit("connection", client, request);
    client.send(JSON.stringify({ type: "snapshot.ready", at: new Date().toISOString() }));
  });
});

server.listen(port, host, async () => {
  const address = `http://${getLanAddress()}:${port}`;
  const pairingPayload = `taphoa-pos://lan-connect?server=${encodeURIComponent(address)}&code=${pairingCode}`;
  console.log(`\nTạp Hóa POS LAN đang chạy tại: ${address}`);
  console.log(`Mở ${address}/pairing trên laptop để hiển thị QR kết nối.`);
  console.log(`Mã ghép thiết bị: ${pairingCode}`);
  console.log("Nhấn Ctrl+C để dừng máy chủ.\n");
  console.log(await QRCode.toString(pairingPayload, { type: "terminal", small: true }));
});
