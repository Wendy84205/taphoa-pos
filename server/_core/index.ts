import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { parse as parseCookie } from "cookie";
import { randomUUID } from "crypto";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { isDatabaseAvailable } from "../db";
import { AUTH_RATE_LIMIT, PIN_RATE_LIMIT, clientAddress, createRequestId, localRateLimitStore, operationalLog } from "../operational";
import { COOKIE_NAME } from "../../shared/const";

const CSRF_COOKIE_NAME = "taphoa_csrf";
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
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  const production = process.env.NODE_ENV === "production";
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

  // Production only accepts explicitly configured browser origins. Development may use local origins.
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    const originAllowed = Boolean(origin && (!production || allowedOrigins.has(origin)));
    if (origin && originAllowed) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header("Vary", "Origin");
    }
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token, X-Request-Id",
    );
    if (originAllowed) res.header("Access-Control-Allow-Credentials", "true");

    if (req.method === "OPTIONS") {
      if (origin && !originAllowed) return res.sendStatus(403);
      res.sendStatus(204);
      return;
    }
    next();
  });

  app.use(express.json({ limit: "6mb" }));
  app.use(express.urlencoded({ limit: "6mb", extended: true }));

  app.use((req, res, next) => {
    const cookies = parseCookie(req.headers.cookie ?? "");
    const csrfToken = cookies[CSRF_COOKIE_NAME] ?? randomUUID();
    if (!cookies[CSRF_COOKIE_NAME]) {
      res.cookie(CSRF_COOKIE_NAME, csrfToken, {
        httpOnly: false,
        secure: production || req.secure || req.header("x-forwarded-proto") === "https",
        sameSite: "lax",
        path: "/",
      });
    }
    (req as express.Request & { csrfToken?: string }).csrfToken = csrfToken;
    next();
  });

  app.use("/api/trpc", (req, res, next) => {
    const path = req.path;
    const policy = path.includes("staffPinLogin") ? PIN_RATE_LIMIT : path.includes("credentialsLogin") || path.includes("credentialsRegister") || path.includes("requestPasswordReset") || path.includes("verifyPasswordResetOtp") ? AUTH_RATE_LIMIT : undefined;
    if (!policy) return next();
    const result = localRateLimitStore.consume(`auth:${clientAddress(req.headers, req.socket.remoteAddress)}:${path}`, policy);
    res.setHeader("RateLimit-Remaining", String(result.remaining));
    if (result.allowed) return next();
    res.setHeader("Retry-After", String(Math.ceil(result.retryAfterMs / 1000)));
    operationalLog("warn", "rate_limit_exceeded", { requestId: req.header("x-request-id"), path });
    return res.status(429).json({ error: "Yêu cầu quá nhiều lần. Vui lòng thử lại sau." });
  });

  app.use("/api/trpc", (req, res, next) => {
    if (SAFE_METHODS.has(req.method)) return next();
    const cookies = parseCookie(req.headers.cookie ?? "");
    const hasCookieSession = Boolean(cookies[COOKIE_NAME]);
    const hasBearerToken = Boolean(req.header("authorization"));
    const expected = (req as express.Request & { csrfToken?: string }).csrfToken;
    if (hasCookieSession && !hasBearerToken && req.header("x-csrf-token") !== expected) {
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
    const payload = { ok: databaseReady, service: "taphoa-pos-api", databaseRequired, databaseReady, timestamp: Date.now(), requestId: req.header("x-request-id") };
    res.status(databaseReady ? 200 : 503).json(payload);
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
      onError({ error, ctx, path, type }) {
        operationalLog("warn", "trpc_error", {
          requestId: ctx?.requestId,
          path,
          type,
          code: error.code,
        });
      },
    }),
  );

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`[api] server listening on port ${port}`);
  });
}

startServer().catch(console.error);
