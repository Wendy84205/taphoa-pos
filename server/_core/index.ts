import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { createCsrfToken, CSRF_COOKIE_NAME, csrfMatches, readCookie } from "../security";
import { COOKIE_NAME } from "../../shared/const";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { registerStripeWebhookRoute } from "../stripe-billing";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { isDatabaseAvailable } from "../db";
import {
  AUTH_RATE_LIMIT,
  PIN_RATE_LIMIT,
  clientAddress,
  createConfiguredRateLimitStore,
  createRequestId,
  operationalLog,
} from "../operational";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) return port;
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

export function createApp() {
  const app = express();
  const production = process.env.NODE_ENV === "production";
  const rateLimitStore = createConfiguredRateLimitStore();
  const allowedOrigins = new Set(
    (process.env.CORS_ORIGINS ?? "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  );

  app.use((req, res, next) => {
    const requestId = createRequestId(req.header("x-request-id"));
    req.headers["x-request-id"] = requestId;
    res.setHeader("x-request-id", requestId);
    res.on("finish", () => {
      if (res.statusCode >= 400) {
        operationalLog(res.statusCode >= 500 ? "error" : "warn", "http_request", {
          requestId,
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
        });
      }
    });
    next();
  });

  app.use((req, res, next) => {
    if (!readCookie(req, CSRF_COOKIE_NAME)) {
      res.cookie(CSRF_COOKIE_NAME, createCsrfToken(), {
        httpOnly: false,
        sameSite: "lax",
        secure: production || req.secure || req.header("x-forwarded-proto") === "https",
        path: "/",
      });
    }

    const origin = typeof req.headers.origin === "string" ? req.headers.origin : undefined;
    const originAllowed = Boolean(origin && (!production || allowedOrigins.has(origin)));
    if (origin && originAllowed) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header("Vary", "Origin");
      res.header("Access-Control-Allow-Credentials", "true");
    }
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token, X-Request-Id, X-Client-Platform");

    if (req.method === "OPTIONS") {
      if (origin && !originAllowed) return res.sendStatus(403);
      return res.sendStatus(204);
    }
    next();
  });

  registerStripeWebhookRoute(app);
  app.use(express.json({ limit: "6mb" }));
  app.use(express.urlencoded({ limit: "1mb", extended: true }));

  app.use("/api/trpc", async (req, res, next) => {
    const path = req.path;
    const policy = path.includes("staffPinLogin")
      ? PIN_RATE_LIMIT
      : path.includes("credentialsLogin") || path.includes("credentialsRegister") || path.includes("requestPasswordReset") || path.includes("verifyPasswordResetOtp")
        ? AUTH_RATE_LIMIT
        : undefined;
    if (!policy) return next();

    let result;
    try {
      result = await rateLimitStore.consume(
        `auth:${clientAddress(req.headers, req.socket.remoteAddress)}:${path}`,
        policy,
      );
    } catch (error) {
      operationalLog("error", "rate_limit_unavailable", {
        requestId: req.header("x-request-id"),
        path,
        error: error instanceof Error ? error.message : "unknown",
      });
      return res.status(503).json({ error: "Dịch vụ bảo mật tạm thời không sẵn sàng." });
    }
    res.setHeader("RateLimit-Remaining", String(result.remaining));
    if (result.allowed) return next();

    res.setHeader("Retry-After", String(Math.ceil(result.retryAfterMs / 1000)));
    operationalLog("warn", "rate_limit_exceeded", { requestId: req.header("x-request-id"), path });
    return res.status(429).json({ error: "Yêu cầu quá nhiều lần. Vui lòng thử lại sau." });
  });

  app.use("/api/trpc", (req, res, next) => {
    if (SAFE_METHODS.has(req.method)) return next();
    const hasCookieSession = Boolean(readCookie(req, COOKIE_NAME));
    const hasBearerToken = Boolean(req.header("authorization"));
    if (hasCookieSession && !hasBearerToken && !csrfMatches(req)) {
      operationalLog("warn", "csrf_rejected", { requestId: req.header("x-request-id"), path: req.path });
      return res.status(403).json({ error: "CSRF token không hợp lệ." });
    }
    next();
  });

  registerStorageProxy(app);
  registerOAuthRoutes(app);

  app.get("/api/health", (req, res) => {
    res.json({ ok: true, service: "taphoa-pos-api", timestamp: Date.now(), requestId: req.header("x-request-id") });
  });

  app.get("/api/readiness", async (req, res) => {
    const databaseRequired = production || process.env.REQUIRE_DATABASE === "true";
    const databaseReady = databaseRequired ? await isDatabaseAvailable() : true;
    const payload = {
      ok: databaseReady,
      service: "taphoa-pos-api",
      databaseRequired,
      databaseReady,
      timestamp: Date.now(),
      requestId: req.header("x-request-id"),
    };
    res.status(databaseReady ? 200 : 503).json(payload);
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
      onError({ error, ctx, path, type }) {
        operationalLog("warn", "trpc_error", { requestId: ctx?.requestId, path, type, code: error.code });
      },
    }),
  );

  return app;
}

export async function startServer(app = createApp()) {
  const server = createServer(app);
  const preferredPort = parseInt(process.env.PORT || "3000", 10);
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  server.listen(port, () => console.log(`[api] server listening on port ${port}`));
}

const app = createApp();

export default app;

if (process.env.NODE_ENV !== "test" && !process.env.VITEST && !process.env.VERCEL) {
  startServer(app).catch((error) => operationalLog("error", "server_start_failed", { error: error instanceof Error ? error.message : "unknown" }));
}
