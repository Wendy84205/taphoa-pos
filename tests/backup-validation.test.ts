import { describe, expect, it } from "vitest";
import { parseJsonBackupContent } from "../lib/backup-validation";

const backup = (payload: Record<string, unknown>) => JSON.stringify({ format: "taphoa-pos-backup", version: 1, payload });
const validPayload = { products: [], cart: [], orders: [], paymentSettings: { bankBin: "", accountNumber: "", accountName: "" } };

describe("local backup validation", () => {
  it("accepts a small valid POS backup", () => {
    expect(parseJsonBackupContent(backup(validPayload))).toEqual(validPayload);
  });

  it("rejects invalid envelopes, missing core lists and unsafe prototype keys", () => {
    expect(() => parseJsonBackupContent("not json")).toThrow("JSON");
    expect(() => parseJsonBackupContent(backup({ products: [], cart: [] }))).toThrow("orders");
    const dangerousKeyBackup = '{"format":"taphoa-pos-backup","version":1,"payload":{"products":[],"cart":[],"orders":[],"__proto__":{"polluted":true}}}';
    expect(() => parseJsonBackupContent(dangerousKeyBackup)).toThrow("key không an toàn");
  });

  it("rejects oversized backup content before restore", () => {
    expect(() => parseJsonBackupContent("x".repeat(4 * 1024 * 1024 + 1))).toThrow("4MB");
  });
});
