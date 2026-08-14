import { spawn } from "node:child_process";
import { once } from "node:events";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as wait } from "node:timers/promises";

import WebSocket from "ws";

const port = 9937;
const databaseFile = join(tmpdir(), `taphoa-pos-lan-test-${Date.now()}.sqlite`);
const child = spawn(process.execPath, ["--experimental-sqlite", "server.mjs"], {
  cwd: process.cwd(),
  env: { ...process.env, PORT: String(port), TAPHOA_DB: databaseFile, TAPHOA_PAIR_CODE: "TEST12" },
  stdio: "ignore",
});

async function waitForHealth() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/health`);
      if (response.ok) return;
    } catch { /* Server chưa sẵn sàng. */ }
    await wait(100);
  }
  throw new Error("Máy chủ LAN không khởi động.");
}

async function main() {
  try {
    await waitForHealth();
    const pairResponse = await fetch(`http://127.0.0.1:${port}/pair`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: "TEST12" }) });
    const pair = await pairResponse.json();
    if (!pair.token) throw new Error("Không nhận được mã ghép thiết bị.");
    const client = new WebSocket(`ws://127.0.0.1:${port}/ws?token=${pair.token}`);
    await once(client, "open");
    const messages = [];
    client.on("message", (raw) => messages.push(JSON.parse(raw.toString())));
    const product = { id: "p-smoke", name: "Sản phẩm LAN", price: 10000, unit: "cái", category: "Khác", stockQuantity: 4, lowStockThreshold: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    const putResponse = await fetch(`http://127.0.0.1:${port}/products/p-smoke`, { method: "PUT", headers: { "Content-Type": "application/json", "X-Device-Token": pair.token }, body: JSON.stringify(product) });
    if (!putResponse.ok) throw new Error("Không lưu được sản phẩm qua LAN.");
    for (let attempt = 0; attempt < 20 && !messages.some((message) => message.type === "product.changed"); attempt += 1) await wait(50);
    if (!messages.some((message) => message.type === "product.changed")) throw new Error("Không nhận được thông báo WebSocket.");
    const snapshotResponse = await fetch(`http://127.0.0.1:${port}/snapshot`, { headers: { "X-Device-Token": pair.token } });
    const snapshot = await snapshotResponse.json();
    if (snapshot.products?.[0]?.id !== "p-smoke") throw new Error("SQLite không trả về dữ liệu vừa lưu.");
    client.close();
    console.log("LAN smoke test passed");
  } finally {
    child.kill();
    await Promise.race([once(child, "exit"), wait(1000)]);
    await Promise.all([databaseFile, `${databaseFile}-wal`, `${databaseFile}-shm`].map((file) => rm(file, { force: true })));
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
