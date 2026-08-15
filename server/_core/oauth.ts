import { randomUUID } from "crypto";
import type { Express, Request, Response } from "express";

import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const.js";
import { createOAuthState, parseOAuthState } from "../../shared/oauth-state";
import { getUserByOpenId, upsertUser } from "../db";
import { operationalLog } from "../operational";
import { readCookie } from "../security";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

const OAUTH_STATE_COOKIE_NAME = "taphoa_oauth_state";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

async function syncUser(userInfo: {
  openId?: string | null;
  name?: string | null;
  email?: string | null;
  loginMethod?: string | null;
  platform?: string | null;
}) {
  if (!userInfo.openId) throw new Error("openId missing from user info");
  const lastSignedIn = new Date();
  await upsertUser({
    openId: userInfo.openId,
    name: userInfo.name || null,
    email: userInfo.email ?? null,
    loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
    lastSignedIn,
  });
  return (await getUserByOpenId(userInfo.openId)) ?? {
    openId: userInfo.openId,
    name: userInfo.name,
    email: userInfo.email,
    loginMethod: userInfo.loginMethod ?? null,
    lastSignedIn,
  };
}

function buildUserResponse(
  user:
    | Awaited<ReturnType<typeof getUserByOpenId>>
    | { openId: string; name?: string | null; email?: string | null; loginMethod?: string | null; lastSignedIn?: Date | null },
) {
  return {
    id: (user as any)?.id ?? null,
    openId: user?.openId ?? null,
    name: user?.name ?? null,
    email: user?.email ?? null,
    loginMethod: user?.loginMethod ?? null,
    lastSignedIn: (user?.lastSignedIn ?? new Date()).toISOString(),
  };
}

export function registerOAuthRoutes(app: Express) {
  /** Web only: binds the OAuth state to an HttpOnly, 10-minute cookie before redirecting to the provider. */
  app.get("/api/oauth/state", (req: Request, res: Response) => {
    const redirectUri = getQueryParam(req, "redirectUri");
    if (!redirectUri) return res.status(400).json({ error: "redirectUri is required" });

    const state = createOAuthState(redirectUri, randomUUID().replace(/-/g, ""));
    if (!parseOAuthState(state)) return res.status(400).json({ error: "redirectUri is not allowed" });

    const options = getSessionCookieOptions(req);
    res.cookie(OAUTH_STATE_COOKIE_NAME, state, {
      ...options,
      maxAge: 10 * 60 * 1000,
      sameSite: "lax",
    });
    return res.json({ state });
  });

  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    const parsedState = state ? parseOAuthState(state) : null;

    if (!code || !state || !parsedState || !parsedState.redirectUri.startsWith("https://") || readCookie(req, OAUTH_STATE_COOKIE_NAME) !== state) {
      res.status(400).json({ error: "OAuth state không hợp lệ hoặc đã hết hạn" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      await syncUser(userInfo);
      const sessionToken = await sdk.createSessionToken(userInfo.openId!, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.clearCookie(OAUTH_STATE_COOKIE_NAME, { ...cookieOptions, sameSite: "lax" });

      const frontendUrl =
        process.env.EXPO_WEB_PREVIEW_URL ||
        process.env.EXPO_PACKAGER_PROXY_URL ||
        "http://localhost:8081";
      res.redirect(302, frontendUrl);
    } catch (error) {
      operationalLog("error", "oauth_callback_failed", { error: error instanceof Error ? error.message : "unknown" });
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });

  app.get("/api/oauth/mobile", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    const parsedState = state ? parseOAuthState(state) : null;
    if (!code || !state || !parsedState || !parsedState.redirectUri.startsWith("manus")) {
      res.status(400).json({ error: "OAuth state không hợp lệ" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      const user = await syncUser(userInfo);
      const sessionToken = await sdk.createSessionToken(userInfo.openId!, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      res.json({ app_session_id: sessionToken, user: buildUserResponse(user) });
    } catch (error) {
      operationalLog("error", "oauth_mobile_exchange_failed", { error: error instanceof Error ? error.message : "unknown" });
      res.status(500).json({ error: "OAuth mobile exchange failed" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    res.json({ success: true });
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);
      res.json({ user: buildUserResponse(user) });
    } catch (error) {
      operationalLog("warn", "auth_me_failed", { error: error instanceof Error ? error.message : "unknown" });
      res.status(401).json({ error: "Not authenticated", user: null });
    }
  });

  /** Legacy iframe bridge. CORS and an explicit Bearer token are required; it never accepts a token in a URL. */
  app.post("/api/auth/session", async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);
      const authHeader = req.headers.authorization || req.headers.Authorization;
      if (typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
        res.status(400).json({ error: "Bearer token required" });
        return;
      }
      const token = authHeader.slice("Bearer ".length).trim();
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.json({ success: true, user: buildUserResponse(user) });
    } catch (error) {
      operationalLog("warn", "auth_session_failed", { error: error instanceof Error ? error.message : "unknown" });
      res.status(401).json({ error: "Invalid token" });
    }
  });
}
