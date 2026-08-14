import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { createRateLimiter, clientIp, createCsrfToken, CSRF_COOKIE_NAME, csrfMatches, readCookie } from "../security";
import { COOKIE_NAME } from "../../shared/const";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";

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
  const authLimiter = createRateLimiter(10, 15 * 60 * 1000);
  const pinLimiter = createRateLimiter(20, 15 * 60 * 1000);

  // In production, only explicitly configured origins may use cookie credentials.
  // Development keeps the preview/LAN workflow flexible without weakening production.
  const allowedOrigins = new Set(
    (process.env.CORS_ORIGINS ?? "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  );
  app.use((req, res, next) => {
    if (!readCookie(req, CSRF_COOKIE_NAME)) {
      res.cookie(CSRF_COOKIE_NAME, createCsrfToken(), {
        httpOnly: false,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });
    }

    const origin = typeof req.headers.origin === "string" ? req.headers.origin : undefined;
    const isDevelopment = process.env.NODE_ENV !== "production";
    const originAllowed = Boolean(origin && (allowedOrigins.has(origin) || isDevelopment));
    if (originAllowed && origin) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header("Vary", "Origin");
      res.header("Access-Control-Allow-Credentials", "true");
    }
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");

    if (req.method === "OPTIONS") {
      if (origin && !originAllowed) {
        res.sendStatus(403);
        return;
      }
      res.sendStatus(204);
      return;
    }
    const trpcPath = req.originalUrl.split("/api/trpc/")[1]?.split("?")[0] ?? "";
    if (req.method === "POST" && trpcPath.startsWith("auth.") && !authLimiter(`${clientIp(req)}:${trpcPath}`)) {
      res.sendStatus(429);
      return;
    }
    if (req.method === "POST" && trpcPath === "auth.staffPinLogin" && !pinLimiter(`${clientIp(req)}:${trpcPath}`)) {
      res.sendStatus(429);
      return;
    }

    const cookieHeader = req.headers.cookie;
    const hasSessionCookie = Boolean(cookieHeader && readCookie(req, COOKIE_NAME));
    if (req.method !== "GET" && req.method !== "HEAD" && hasSessionCookie && req.path.startsWith("/api/trpc") && !csrfMatches(req)) {
      res.sendStatus(403);
      return;
    }
    next();
  });

  // Snapshots are whole-state payloads, but must remain bounded to prevent memory/CPU abuse.
  app.use(express.json({ limit: "5mb" }));
  app.use(express.urlencoded({ limit: "1mb", extended: true }));

  registerStorageProxy(app);
  registerOAuthRoutes(app);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: Date.now() });
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
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
