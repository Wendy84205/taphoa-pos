import { describe, expect, it, vi } from "vitest";
import { appRouter } from "../server/routers";
import type { TrpcContext } from "../server/_core/context";

const dbMock = vi.hoisted(() => ({
  getStoreById: vi.fn(),
  getStoreMemberById: vi.fn(),
  ensureWorkspaceForUser: vi.fn(),
  getSnapshotForUser: vi.fn(),
  listSnapshotBackupsForUser: vi.fn(),
  restoreSnapshotBackupForUser: vi.fn(),
  listStoreMembers: vi.fn(),
  listAuditLogsForUser: vi.fn(),
  updateStoreTypeForUser: vi.fn(),
  appendAuditLog: vi.fn(),
  updateStoreMemberPinState: vi.fn(),
  getUserById: vi.fn(),
  getUserByOpenId: vi.fn(),
}));

vi.mock("../server/db", () => dbMock);

function context(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-owner",
      email: "owner@example.com",
      phone: null,
      passwordHash: null,
      name: "Owner",
      loginMethod: "credentials_email",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      cookie: vi.fn(),
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("workspace security guards", () => {
  it("rejects PIN login when the store is Solo", async () => {
    dbMock.getStoreById.mockResolvedValue({ id: 7, storeType: "solo" });
    const caller = appRouter.createCaller(context());
    await expect(caller.auth.staffPinLogin({ storeId: 7, memberId: 3, pin: "1234" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects PIN login for a disabled staff member", async () => {
    dbMock.getStoreById.mockResolvedValue({ id: 7, storeType: "withStaff" });
    dbMock.getStoreMemberById.mockResolvedValue({ id: 3, storeId: 7, userId: 9, role: "staff", status: "disabled", pinHash: "hash" });
    const caller = appRouter.createCaller(context());
    await expect(caller.auth.staffPinLogin({ storeId: 7, memberId: 3, pin: "1234" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("blocks staff from overwriting a tenant snapshot", async () => {
    dbMock.ensureWorkspaceForUser.mockResolvedValue({ store: { id: 7, storeType: "withStaff" }, membership: { storeId: 7, userId: 1, role: "staff", status: "active" } });
    const caller = appRouter.createCaller(context());
    await expect(caller.workspace.snapshot.push({ snapshot: {}, clientVersion: 2 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
