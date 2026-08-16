import { describe, expect, it } from "vitest";

import { findByBarcode, normalizeBarcode, shouldAcceptBarcodeScan } from "../lib/barcode-lookup";

const catalog = [
  { id: "lavie", barcode: "8934588012225" },
  { id: "shelf-code", barcode: "AB-39/x" },
  { id: "no-code" },
];

describe("barcode scan lookup", () => {
  it("normalizes whitespace without changing meaningful Code128 characters", () => {
    expect(normalizeBarcode("  8934588012225\n")).toBe("8934588012225");
    expect(normalizeBarcode(" AB-39/x ")).toBe("AB-39/x");
  });

  it("rejects empty or non-string input", () => {
    expect(normalizeBarcode(" \n ")).toBeNull();
    expect(normalizeBarcode(undefined)).toBeNull();
  });

  it("finds only items already in the catalog", () => {
    expect(findByBarcode(catalog, " 8934588012225 ")?.id).toBe("lavie");
    expect(findByBarcode(catalog, "missing-code")).toBeUndefined();
  });

  it("accepts only the first valid scanner event", () => {
    expect(shouldAcceptBarcodeScan(false, "8934588012225")).toBe(true);
    expect(shouldAcceptBarcodeScan(false, "  ")).toBe(false);
    expect(shouldAcceptBarcodeScan(true, "8934588012225")).toBe(false);
  });
});
