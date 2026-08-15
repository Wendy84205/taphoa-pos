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
  consume(key: string, policy: RateLimitPolicy, now?: number): RateLimitResult | Promise<RateLimitResult>;
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

const FIXED_WINDOW_LUA = [
  "local count = redis.call('INCR', KEYS[1])",
  "if count == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end",
  "local ttl = redis.call('PTTL', KEYS[1])",
  "return { count, ttl }",
].join("\n");

type UpstashResult = { result?: unknown; error?: string };

/**
 * HTTP adapter for Upstash Redis. It uses a single Lua EVAL command so
 * INCR + expiry remain atomic across API instances without a TCP Redis client.
 */
export class UpstashRedisRateLimitStore implements RateLimitStore {
  constructor(
    private readonly restUrl: string,
    private readonly token: string,
    private readonly namespace = "taphoa:rate-limit",
  ) {}

  async consume(key: string, policy: RateLimitPolicy): Promise<RateLimitResult> {
    const safeKey = `${this.namespace}:${key}`.slice(0, 500);
    const response = await fetch(this.restUrl.replace(/\/$/, ""), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(["EVAL", FIXED_WINDOW_LUA, 1, safeKey, policy.windowMs]),
    });
    if (!response.ok) throw new Error(`Upstash rate limit request failed (${response.status})`);

    const payload = (await response.json()) as UpstashResult;
    if (payload.error) throw new Error(`Upstash rate limit error: ${payload.error}`);
    const result = payload.result;
    if (!Array.isArray(result) || typeof result[0] !== "number" || typeof result[1] !== "number") {
      throw new Error("Upstash rate limit returned an invalid response");
    }

    const count = result[0];
    const retryAfterMs = Math.max(0, result[1]);
    return {
      allowed: count <= policy.limit,
      remaining: Math.max(0, policy.limit - count),
      retryAfterMs: count <= policy.limit ? 0 : retryAfterMs,
    };
  }

  async ping(): Promise<boolean> {
    const response = await fetch(this.restUrl.replace(/\/$/, ""), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(["PING"]),
    });
    if (!response.ok) return false;
    const payload = (await response.json()) as UpstashResult;
    return payload.result === "PONG";
  }
}

export class FallbackRateLimitStore implements RateLimitStore {
  constructor(
    private readonly primary: RateLimitStore,
    private readonly fallback: RateLimitStore,
    private readonly onFallback?: (error: unknown) => void,
  ) {}

  async consume(key: string, policy: RateLimitPolicy, now?: number): Promise<RateLimitResult> {
    try {
      return await this.primary.consume(key, policy, now);
    } catch (error) {
      this.onFallback?.(error);
      return await this.fallback.consume(key, policy, now);
    }
  }
}

export function createConfiguredRateLimitStore(env: NodeJS.ProcessEnv = process.env): RateLimitStore {
  const restUrl = env.UPSTASH_REDIS_REST_URL?.trim();
  const token = env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!restUrl || !token) return localRateLimitStore;
  return new FallbackRateLimitStore(
    new UpstashRedisRateLimitStore(restUrl, token),
    localRateLimitStore,
    (error) => operationalLog("error", "upstash_rate_limit_fallback", { error: error instanceof Error ? error.message : "unknown" }),
  );
}

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
