import { describe, expect, it } from "vitest";
import { AUTH_RATE_LIMIT, MemoryRateLimitStore, redactOperationalData } from "../server/operational";
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
});
