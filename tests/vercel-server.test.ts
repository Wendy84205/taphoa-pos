import { afterEach, describe, expect, it } from "vitest";
import type { Server } from "node:http";
import app, { createApp } from "../server/_core/index";

const servers: Server[] = [];

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise<void>((resolve, reject) => {
          server.close((error) => (error ? reject(error) : resolve()));
        }),
    ),
  );
});

describe("Vercel Express entrypoint", () => {
  it("exports an Express application without starting a listener during tests", async () => {
    expect(typeof app).toBe("function");
    const server = createApp().listen(0);
    servers.push(server);
    await new Promise<void>((resolve) => server.once("listening", () => resolve()));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Expected TCP test listener");

    const response = await fetch(`http://127.0.0.1:${address.port}/api/health`);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true, service: "taphoa-pos-api" });
  });
});
