import { randomUUID } from "crypto";

export type RateLimitPolicy = {
  limit: number;
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
};

export interface RateLimitStore {
  consume(key: string, policy: RateLimitPolicy, now?: number): RateLimitResult;
}

/**
 * Default local limiter. The interface is intentionally small so a Redis-backed
 * store can replace it when the API is deployed on more than one instance.
 */
export class MemoryRateLimitStore implements RateLimitStore {
  private readonly attempts = new Map<string, number[]>();

  consume(key: string, policy: RateLimitPolicy, now = Date.now()): RateLimitResult {
    const cutoff = now - policy.windowMs;
    const active = (this.attempts.get(key) ?? []).filter((attempt) => attempt > cutoff);

    if (active.length >= policy.limit) {
      this.attempts.set(key, active);
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: Math.max(1, active[0] + policy.windowMs - now),
      };
    }

    active.push(now);
    this.attempts.set(key, active);
    return {
      allowed: true,
      remaining: Math.max(0, policy.limit - active.length),
      retryAfterMs: 0,
    };
  }
}

export const localRateLimitStore = new MemoryRateLimitStore();

export const AUTH_RATE_LIMIT: RateLimitPolicy = { limit: 10, windowMs: 15 * 60 * 1000 };
export const PIN_RATE_LIMIT: RateLimitPolicy = { limit: 8, windowMs: 15 * 60 * 1000 };

const SENSITIVE_FIELD = /password|pin|token|secret|cookie|authorization|snapshot|email|phone/i;

export function createRequestId(requestId?: string): string {
  return requestId && /^[a-zA-Z0-9_-]{8,100}$/.test(requestId)
    ? requestId
    : randomUUID();
}

export function clientAddress(headers: Record<string, string | string[] | undefined>, fallback?: string): string {
  const forwarded = headers["x-forwarded-for"];
  const firstForwarded = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0];
  return (firstForwarded?.trim() || fallback || "unknown").slice(0, 120);
}

export function redactOperationalData(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactOperationalData);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nested]) => [
        key,
        SENSITIVE_FIELD.test(key) ? "[REDACTED]" : redactOperationalData(nested),
      ]),
    );
  }
  return value;
}

export function operationalLog(
  level: "info" | "warn" | "error",
  event: string,
  data: Record<string, unknown> = {},
): void {
  const safeData = redactOperationalData(data) as Record<string, unknown>;
  const payload = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event,
    ...safeData,
  });

  if (level === "error") console.error(payload);
  else if (level === "warn") console.warn(payload);
  else console.info(payload);
}
