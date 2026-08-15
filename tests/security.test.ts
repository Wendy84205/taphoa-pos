import { describe, expect, it } from "vitest";
import { createCsrfToken, createRateLimiter, csrfMatches } from "../server/security";

describe("security helpers", () => {
  it("limits requests within a window and resets after expiry", () => {
    const limiter = createRateLimiter(2, 1000);
    expect(limiter("ip:login", 100)).toBe(true);
    expect(limiter("ip:login", 200)).toBe(true);
    expect(limiter("ip:login", 300)).toBe(false);
    expect(limiter("ip:login", 1200)).toBe(true);
  });

  it("creates high-entropy csrf tokens", () => {
    const first = createCsrfToken();
    const second = createCsrfToken();
    expect(first).toMatch(/^[a-f0-9]{64}$/);
    expect(second).toMatch(/^[a-f0-9]{64}$/);
    expect(first).not.toBe(second);
  });

  it("accepts only a matching csrf cookie and header", () => {
    const token = createCsrfToken();
    const request = { headers: { cookie: `taphoa_csrf=${token}`, "x-csrf-token": token } } as any;
    expect(csrfMatches(request)).toBe(true);
    request.headers["x-csrf-token"] = createCsrfToken();
    expect(csrfMatches(request)).toBe(false);
  });
});
