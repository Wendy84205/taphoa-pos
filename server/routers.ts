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
import { validateSnapshotPayload } from "./snapshot-validation";

const snapshotSchema = z.record(z.string(), z.unknown()).superRefine((snapshot, ctx) => {
  const result = validateSnapshotPayload(snapshot);
  if (!result.valid) ctx.addIssue({ code: "custom", message: result.reason });
});
const credentialSchema = z.object({ kind: z.enum(["email", "phone"]), identifier: z.string().min(3), password: z.string().min(8), name: z.string().trim().min(1).max(120).optional() });
const profileSchema = z.object({ name: z.string().trim().min(1).max(120), email: z.string().trim().email().optional().or(z.literal("")), phone: z.string().trim().optional() });
const resetIdentifierSchema = z.object({ kind: z.enum(["email", "phone"]), identifier: z.string().min(3) });
const staffCreateSchema = z.object({ kind: z.enum(["email", "phone"]), identifier: z.string().min(3), name: z.string().trim().min(1).max(120), password: z.string().min(8), pin: z.string().regex(/^\d{4,6}$/, "PIN cần 4–6 chữ số.") });

function publicUser(user: NonNullable<Awaited<ReturnType<typeof db.getUserByOpenId>>>) {
  return { id: user.id, openId: user.openId, name: user.name, email: user.email, phone: user.phone, loginMethod: user.loginMethod, lastSignedIn: user.lastSignedIn };
}

async function establishCredentialsSession(ctx: TrpcContext, user: NonNullable<Awaited<ReturnType<typeof db.getUserByOpenId>>>) {
  const token = await sdk.createSessionToken(user.openId, { name: user.name || user.email || user.phone || "Tạp Hóa POS" });
  const cookieOptions = getSessionCookieOptions(ctx.req);
  ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
  const platform = String(ctx.req.headers["x-client-platform"] ?? "").toLowerCase();
  const isWeb = platform === "web" || Boolean(ctx.req.headers.origin);
  return { ...(isWeb ? {} : { token }), user: publicUser(user) };
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
    staffPinLogin: publicProcedure.input(z.object({ storeId: z.number().int().positive(), memberId: z.number().int().positive(), pin: z.string().regex(/^\d{4,6}$/) })).mutation(async ({ ctx, input }) => {
      const store = await db.getStoreById(input.storeId);
      if (!store || store.storeType !== "withStaff") throw new TRPCError({ code: "FORBIDDEN", message: "Quán này chưa bật chế độ Có nhân viên." });
      const member = await db.getStoreMemberById(input.storeId, input.memberId);
      if (!member || member.status !== "active" || !member.pinHash) throw new TRPCError({ code: "UNAUTHORIZED", message: "Không tìm thấy nhân viên hoặc PIN chưa được thiết lập." });
      if (member.pinLockedUntil && member.pinLockedUntil.getTime() > Date.now()) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "PIN đang bị khóa tạm thời. Hãy thử lại sau." });
      if (!verifyPassword(input.pin, member.pinHash)) {
        const attempts = member.pinFailedAttempts + 1;
        const lockedUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
        await db.updateStoreMemberPinState(member.id, { pinFailedAttempts: attempts, pinLockedUntil: lockedUntil });
        throw new TRPCError({ code: "UNAUTHORIZED", message: lockedUntil ? "PIN sai quá nhiều lần, đã khóa 15 phút." : "PIN không đúng." });
      }
      await db.updateStoreMemberPinState(member.id, { pinFailedAttempts: 0, pinLockedUntil: null });
      const user = await db.getUserById(member.userId);
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Tài khoản nhân viên không tồn tại." });
      await db.appendAuditLog(user.id, input.storeId, "staff_pin_login", "store_member", String(member.id));
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
    updateStoreType: protectedProcedure.input(z.object({ storeType: z.enum(["solo", "withStaff"]) })).mutation(async ({ ctx, input }) => {
      const updated = await db.updateStoreTypeForUser(ctx.user.id, input.storeType);
      if (!updated) throw new TRPCError({ code: "FORBIDDEN", message: "Chỉ chủ quán được đổi loại hình quán." });
      return updated;
    }),
    staff: router({
      update: protectedProcedure.input(z.object({ memberId: z.number().int().positive(), status: z.enum(["active", "disabled"]).optional(), pin: z.string().regex(/^\d{4,6}$/).optional() })).mutation(async ({ ctx, input }) => {
        if (!input.status && !input.pin) throw new TRPCError({ code: "BAD_REQUEST", message: "Cần chọn trạng thái hoặc nhập PIN mới." });
        const updated = await db.updateStoreStaff(ctx.user.id, input.memberId, { status: input.status, pinHash: input.pin ? hashPassword(input.pin) : undefined });
        if (!updated) throw new TRPCError({ code: "FORBIDDEN", message: "Không thể cập nhật nhân viên này." });
        return updated;
      }),
      create: protectedProcedure.input(staffCreateSchema).mutation(async ({ ctx, input }) => {
        const identifier = input.kind === "email" ? normalizeEmail(input.identifier) : normalizePhone(input.identifier);
        if (input.kind === "email" && !/^\S+@\S+\.\S+$/.test(identifier)) throw new TRPCError({ code: "BAD_REQUEST", message: "Email nhân viên chưa đúng định dạng." });
        if (input.kind === "phone" && !validatePhone(identifier)) throw new TRPCError({ code: "BAD_REQUEST", message: "Số điện thoại nhân viên chưa đúng định dạng." });
        const workspace = await db.ensureWorkspaceForUser(ctx.user.id);
        if (!workspace || workspace.membership.role !== "owner") throw new TRPCError({ code: "FORBIDDEN", message: "Chỉ chủ quán được tạo nhân viên." });
        try {
          const member = await db.createStoreStaff(ctx.user.id, { ...input, identifier, password: input.password, pinHash: hashPassword(input.pin) });
          if (!member) throw new Error("Không thể tạo nhân viên.");
          return member;
        } catch (error) { throw new TRPCError({ code: "CONFLICT", message: error instanceof Error ? error.message : "Không thể tạo nhân viên." }); }
      }),
    }),
    audit: protectedProcedure.query(async ({ ctx }) => {
      const logs = await db.listAuditLogsForUser(ctx.user.id);
      if (!logs) throw new TRPCError({ code: "FORBIDDEN", message: "Chỉ chủ quán được xem nhật ký." });
      return logs;
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
        try {
          return await db.upsertSnapshotForUser(ctx.user.id, input.snapshot, input.clientVersion);
        } catch (error) {
          if (error instanceof db.SnapshotConflictError) throw new TRPCError({ code: "CONFLICT", message: error.message, cause: { currentVersion: error.currentVersion } });
          throw error;
        }
      }),
      backups: protectedProcedure.query(async ({ ctx }) => {
        const workspace = await db.ensureWorkspaceForUser(ctx.user.id);
        if (!workspace) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể mở quán." });
        if (workspace.membership.role !== "owner") throw new TRPCError({ code: "FORBIDDEN", message: "Chỉ chủ quán được xem backup." });
        return db.listSnapshotBackupsForUser(ctx.user.id);
      }),
      restore: protectedProcedure.input(z.object({ backupId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
        const workspace = await db.ensureWorkspaceForUser(ctx.user.id);
        if (!workspace) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Không thể mở quán." });
        if (workspace.membership.role !== "owner") throw new TRPCError({ code: "FORBIDDEN", message: "Chỉ chủ quán được khôi phục backup." });
        return db.restoreSnapshotBackupForUser(ctx.user.id, input.backupId);
      }),
    }),
  }),
});

export type AppRouter = typeof appRouter;
