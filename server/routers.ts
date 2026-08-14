import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";

const snapshotSchema = z.record(z.string(), z.unknown());

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
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
