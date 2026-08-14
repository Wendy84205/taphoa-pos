import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import type { TrpcContext } from "./_core/context";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import { COOKIE_NAME, ONE_YEAR_MS } from "../shared/const";
import { hashPassword, normalizeEmail, normalizePhone, credentialsOpenId, validatePassword, validatePhone, verifyPassword } from "./credential-auth";

const snapshotSchema = z.record(z.string(), z.unknown());
const credentialSchema = z.object({ kind: z.enum(["email", "phone"]), identifier: z.string().min(3), password: z.string().min(8), name: z.string().trim().min(1).max(120).optional() });

function publicUser(user: NonNullable<Awaited<ReturnType<typeof db.getUserByOpenId>>>) {
  return { id: user.id, openId: user.openId, name: user.name, email: user.email, loginMethod: user.loginMethod, lastSignedIn: user.lastSignedIn };
}

async function establishCredentialsSession(ctx: TrpcContext, user: NonNullable<Awaited<ReturnType<typeof db.getUserByOpenId>>>) {
  const token = await sdk.createSessionToken(user.openId, { name: user.name || user.email || user.phone || "Tạp Hóa POS" });
  const cookieOptions = getSessionCookieOptions(ctx.req);
  ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
  return { token, user: publicUser(user) };
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    credentialsRegister: publicProcedure.input(credentialSchema).mutation(async ({ ctx, input }) => {
      const identifier = input.kind === "email" ? normalizeEmail(input.identifier) : normalizePhone(input.identifier);
      if (input.kind === "email" && !/^\S+@\S+\.\S+$/.test(identifier)) throw new TRPCError({ code: "BAD_REQUEST", message: "Email chưa đúng định dạng." });
      if (input.kind === "phone" && !validatePhone(identifier)) throw new TRPCError({ code: "BAD_REQUEST", message: "Số điện thoại Việt Nam chưa đúng định dạng." });
      if (!validatePassword(input.password)) throw new TRPCError({ code: "BAD_REQUEST", message: "Mật khẩu cần ít nhất 8 ký tự." });
      const existing = input.kind === "email" ? await db.getUserByEmail(identifier) : await db.getUserByPhone(identifier);
      if (existing?.passwordHash) throw new TRPCError({ code: "CONFLICT", message: "Thông tin đăng nhập đã tồn tại. Hãy đăng nhập hoặc dùng khôi phục mật khẩu." });
      const openId = existing?.openId ?? credentialsOpenId(input.kind, identifier);
      await db.upsertUser({ openId, name: input.name?.trim() || existing?.name || null, email: input.kind === "email" ? identifier : existing?.email ?? null, phone: input.kind === "phone" ? identifier : existing?.phone ?? null, passwordHash: hashPassword(input.password), loginMethod: input.kind === "email" ? "credentials_email" : "credentials_phone", lastSignedIn: new Date() });
      const user = await db.getUserByOpenId(openId);
      if (!user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể tạo tài khoản lúc này." });
      return establishCredentialsSession(ctx, user);
    }),
    credentialsLogin: publicProcedure.input(credentialSchema.omit({ name: true })).mutation(async ({ ctx, input }) => {
      const identifier = input.kind === "email" ? normalizeEmail(input.identifier) : normalizePhone(input.identifier);
      const user = input.kind === "email" ? await db.getUserByEmail(identifier) : await db.getUserByPhone(identifier);
      if (!user || !verifyPassword(input.password, user.passwordHash)) throw new TRPCError({ code: "UNAUTHORIZED", message: "Thông tin đăng nhập không đúng." });
      await db.upsertUser({ openId: user.openId, lastSignedIn: new Date() });
      const refreshed = await db.getUserByOpenId(user.openId);
      if (!refreshed) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể mở phiên đăng nhập." });
      return establishCredentialsSession(ctx, refreshed);
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  workspace: router({
    me: protectedProcedure.query(async ({ ctx }) => {
      const workspace = await db.ensureWorkspaceForUser(ctx.user.id, ctx.user.name ? `Quầy của ${ctx.user.name}` : undefined);
      if (!workspace) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể mở dữ liệu quán trên cloud." });
      return workspace;
    }),
    members: protectedProcedure.query(async ({ ctx }) => {
      const workspace = await db.ensureWorkspaceForUser(ctx.user.id);
      if (!workspace) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể mở quán." });
      if (workspace.membership.role !== "owner") throw new TRPCError({ code: "FORBIDDEN", message: "Chỉ chủ quán được xem thành viên." });
      return db.listStoreMembers(ctx.user.id);
    }),
    snapshot: router({
      get: protectedProcedure.query(async ({ ctx }) => db.getSnapshotForUser(ctx.user.id)),
      push: protectedProcedure.input(z.object({ snapshot: snapshotSchema, clientVersion: z.number().int().nonnegative().optional() })).mutation(async ({ ctx, input }) => {
        const workspace = await db.ensureWorkspaceForUser(ctx.user.id);
        if (!workspace) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể mở quán." });
        if (workspace.membership.role !== "owner") throw new TRPCError({ code: "FORBIDDEN", message: "Nhân viên chưa được phép ghi đè dữ liệu kho trên cloud." });
        return db.upsertSnapshotForUser(ctx.user.id, input.snapshot);
      }),
    }),
  }),
});

export type AppRouter = typeof appRouter;
