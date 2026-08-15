import { randomBytes, timingSafeEqual } from "node:crypto";
import type { Request } from "express";
import { parse as parseCookieHeader } from "cookie";

export const CSRF_COOKIE_NAME = "taphoa_csrf";

export function createCsrfToken() {
  return randomBytes(32).toString("hex");
}

export function readCookie(req: Request, name: string) {
  const header = req.headers.cookie;
  if (!header) return undefined;
  return parseCookieHeader(header)[name];
}

export function csrfMatches(req: Request) {
  const cookieToken = readCookie(req, CSRF_COOKIE_NAME);
  const headerToken = req.headers["x-csrf-token"];
  if (!cookieToken || typeof headerToken !== "string") return false;
  const expected = Buffer.from(cookieToken);
  const actual = Buffer.from(headerToken);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

type RateBucket = { count: number; resetAt: number };

export function createRateLimiter(limit: number, windowMs: number) {
  const buckets = new Map<string, RateBucket>();
  return (key: string, now = Date.now()) => {
    const current = buckets.get(key);
    if (!current || current.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }
    if (current.count >= limit) return false;
    current.count += 1;
    return true;
  };
}

export function clientIp(req: Request) {
  return req.ip || req.socket.remoteAddress || "unknown";
}
