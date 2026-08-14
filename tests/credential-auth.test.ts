import { describe, expect, it } from "vitest";

import { credentialsOpenId, hashPassword, normalizeEmail, normalizePhone, validatePassword, validatePhone, verifyPassword } from "../server/credential-auth";

describe("credential auth helpers", () => {
  it("normalizes Vietnamese identifiers", () => {
    expect(normalizeEmail("  Owner@Example.COM ")).toBe("owner@example.com");
    expect(normalizePhone("+84 912 345 678")).toBe("0912345678");
    expect(credentialsOpenId("phone", "0912345678")).toBe("credentials:phone:0912345678");
  });

  it("hashes and verifies passwords without storing plain text", () => {
    const hash = hashPassword("matkhau-an-toan");
    expect(hash).not.toContain("matkhau-an-toan");
    expect(verifyPassword("matkhau-an-toan", hash)).toBe(true);
    expect(verifyPassword("sai-mat-khau", hash)).toBe(false);
  });

  it("validates password and phone requirements", () => {
    expect(validatePassword("1234567")).toBe(false);
    expect(validatePassword("12345678")).toBe(true);
    expect(validatePhone("0912345678")).toBe(true);
    expect(validatePhone("123")).toBe(false);
  });
});
