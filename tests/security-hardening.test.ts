import { describe, expect, it } from "vitest";
import { AUTH_RATE_LIMIT, MemoryRateLimitStore, UpstashRedisRateLimitStore, createConfiguredRateLimitStore, redactOperationalData } from "../server/operational";
import { validateSnapshotPayload } from "../server/snapshot-validation";

describe("production hardening helpers", () => {
  it("limits repeated authentication requests inside a time window", () => {
    const limiter = new MemoryRateLimitStore();
    for (let attempt = 0; attempt < AUTH_RATE_LIMIT.limit; attempt += 1) {
      expect(limiter.consume("login:127.0.0.1", AUTH_RATE_LIMIT, 1_000).allowed).toBe(true);
    }
    const blocked = limiter.consume("login:127.0.0.1", AUTH_RATE_LIMIT, 1_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });

  it("redacts credential, token and snapshot details before logs are emitted", () => {
    expect(redactOperationalData({ password: "secret", nested: { token: "abc", visible: "ok" }, snapshot: { items: [] } })).toEqual({
      password: "[REDACTED]",
      nested: { token: "[REDACTED]", visible: "ok" },
      snapshot: "[REDACTED]",
    });
  });

  it("rejects snapshot payloads that exceed structural limits", () => {
    const tooDeep: Record<string, unknown> = {};
    let cursor: Record<string, unknown> = tooDeep;
    for (let index = 0; index < 20; index += 1) {
      cursor.next = {};
      cursor = cursor.next as Record<string, unknown>;
    }
    const result = validateSnapshotPayload(tooDeep);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toContain("sâu quá");
  });

  it("accepts a normal POS snapshot", () => {
    expect(validateSnapshotPayload({ products: [{ id: "milk", stock: 10 }], invoices: [] })).toMatchObject({ valid: true });
  });

  it("keeps memory limiting when Upstash credentials are absent", () => {
    expect(createConfiguredRateLimitStore({} as NodeJS.ProcessEnv)).toBeInstanceOf(MemoryRateLimitStore);
  });

  it("uses atomic Redis response semantics for a configured Upstash store", async () => {
    const originalFetch = global.fetch;
    global.fetch = (async () => new Response(JSON.stringify({ result: [11, 12_000] }), { status: 200 })) as typeof fetch;
    try {
      const store = new UpstashRedisRateLimitStore("https://example.upstash.io", "token");
      await expect(store.consume("login:1", { limit: 10, windowMs: 15_000 })).resolves.toEqual({ allowed: false, remaining: 0, retryAfterMs: 12_000 });
    } finally {
      global.fetch = originalFetch;
    }
  });

  const hasUpstashCredentials = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
  it.skipIf(!hasUpstashCredentials)("verifies the configured Upstash Redis credentials with PING", async () => {
    const store = new UpstashRedisRateLimitStore(
      process.env.UPSTASH_REDIS_REST_URL!,
      process.env.UPSTASH_REDIS_REST_TOKEN!,
    );
    await expect(store.ping()).resolves.toBe(true);
  });
});
