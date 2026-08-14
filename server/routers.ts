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
const profileSchema = z.object({ name: z.string().trim().min(1).max(120), email: z.string().trim().email().optional().or(z.literal("")), phone: z.string().trim().optional() });
const resetIdentifierSchema = z.object({ kind: z.enum(["email", "phone"]), identifier: z.string().min(3) });

function publicUser(user: NonNullable<Awaited<ReturnType<typeof db.getUserByOpenId>>>) {
  return { id: user.id, openId: user.openId, name: user.name, email: user.email, phone: user.phone, loginMethod: user.loginMethod, lastSignedIn: user.lastSignedIn };
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
    profile: protectedProcedure.query(async ({ ctx }) => {
      const user = await db.getUserById(ctx.user.id);
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "Không tìm thấy hồ sơ tài khoản." });
      return publicUser(user);
    }),
    updateProfile: protectedProcedure.input(profileSchema).mutation(async ({ ctx, input }) => {
      const email = input.email ? normalizeEmail(input.email) : null;
      const phone = input.phone ? normalizePhone(input.phone) : null;
      if (email && !/^\S+@\S+\.\S+$/.test(email)) throw new TRPCError({ code: "BAD_REQUEST", message: "Email chưa đúng định dạng." });
      if (phone && !validatePhone(phone)) throw new TRPCError({ code: "BAD_REQUEST", message: "Số điện thoại Việt Nam chưa đúng định dạng." });
      const emailOwner = email ? await db.getUserByEmail(email) : undefined;
      const phoneOwner = phone ? await db.getUserByPhone(phone) : undefined;
      if (emailOwner && emailOwner.id !== ctx.user.id) throw new TRPCError({ code: "CONFLICT", message: "Email đã được sử dụng." });
      if (phoneOwner && phoneOwner.id !== ctx.user.id) throw new TRPCError({ code: "CONFLICT", message: "Số điện thoại đã được sử dụng." });
      const updated = await db.updateUserProfile(ctx.user.id, { name: input.name.trim(), email, phone });
      if (!updated) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể cập nhật hồ sơ." });
      return publicUser(updated);
    }),
    changePassword: protectedProcedure.input(z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(8) })).mutation(async ({ ctx, input }) => {
      const user = await db.getUserById(ctx.user.id);
      if (!user?.passwordHash || !verifyPassword(input.currentPassword, user.passwordHash)) throw new TRPCError({ code: "UNAUTHORIZED", message: "Mật khẩu hiện tại không đúng." });
      if (!validatePassword(input.newPassword)) throw new TRPCError({ code: "BAD_REQUEST", message: "Mật khẩu mới cần ít nhất 8 ký tự." });
      const updated = await db.updateUserProfile(ctx.user.id, { passwordHash: hashPassword(input.newPassword) });
      if (!updated) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể đổi mật khẩu." });
      return { success: true } as const;
    }),
    requestPasswordReset: publicProcedure.input(resetIdentifierSchema).mutation(async ({ input }) => {
      const identifier = input.kind === "email" ? normalizeEmail(input.identifier) : normalizePhone(input.identifier);
      const providerConfigured = Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER);
      if (!providerConfigured) return { accepted: false, providerConfigured: false, message: "SMS OTP chưa được cấu hình. Vui lòng liên hệ quản trị viên để khôi phục mật khẩu." };
      return { accepted: false, providerConfigured: true, message: `Đã tiếp nhận yêu cầu cho ${identifier}; cần bật SMS adapter trước khi gửi mã.` };
    }),
    verifyPasswordResetOtp: publicProcedure.input(z.object({ kind: z.enum(["email", "phone"]), identifier: z.string().min(3), otp: z.string().regex(/^\d{6}$/), newPassword: z.string().min(8) })).mutation(async () => {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "OTP SMS chưa được cấu hình nên chưa thể xác nhận mã." });
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
