import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, Store, StoreMember, auditLogs, authChallenges, posSnapshots, snapshotBackups, storeMembers, stores, users } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { credentialsOpenId, hashPassword } from "./credential-auth";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "phone", "passwordHash", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];
  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    values[field] = value ?? null;
    updateSet[field] = value ?? null;
  };
  textFields.forEach(assignNullable);
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByPhone(phone: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserProfile(id: number, values: { name?: string | null; email?: string | null; phone?: string | null; passwordHash?: string | null }) {
  const db = await getDb();
  if (!db) throw new Error("Cloud database is not available");
  await db.update(users).set(values).where(eq(users.id, id));
  return getUserById(id);
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createAuthChallenge(input: { userId?: number; identifier: string; channel: "sms" | "email"; purpose: "login_otp" | "reset_password"; codeHash: string; expiresAt: Date }) {
  const db = await getDb();
  if (!db) throw new Error("Cloud database is not available");
  await db.insert(authChallenges).values(input);
}

export async function getLatestAuthChallenge(identifier: string, purpose: "login_otp" | "reset_password") {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(authChallenges).where(and(eq(authChallenges.identifier, identifier), eq(authChallenges.purpose, purpose))).orderBy(desc(authChallenges.id)).limit(1);
  return rows[0];
}

export async function consumeAuthChallenge(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Cloud database is not available");
  await db.update(authChallenges).set({ consumedAt: new Date() }).where(eq(authChallenges.id, id));
}

export async function incrementAuthChallengeAttempts(id: number, attempts: number) {
  const db = await getDb();
  if (!db) throw new Error("Cloud database is not available");
  await db.update(authChallenges).set({ attempts }).where(eq(authChallenges.id, id));
}

export type Workspace = { store: Store; membership: StoreMember };

export async function getWorkspaceForUser(userId: number): Promise<Workspace | null> {
  const db = await getDb();
  if (!db) return null;
  const memberships = await db.select().from(storeMembers).where(and(eq(storeMembers.userId, userId), eq(storeMembers.status, "active"))).orderBy(desc(storeMembers.id)).limit(1);
  const membership = memberships[0];
  if (!membership) return null;
  const store = (await db.select().from(stores).where(eq(stores.id, membership.storeId)).limit(1))[0];
  return store ? { store, membership } : null;
}

export async function ensureWorkspaceForUser(userId: number, suggestedName?: string): Promise<Workspace | null> {
  const existing = await getWorkspaceForUser(userId);
  if (existing) return existing;
  const db = await getDb();
  if (!db) return null;
  await db.insert(stores).values({ name: suggestedName?.trim() || "Quán tạp hóa của tôi", ownerUserId: userId, subscriptionPlan: "free" });
  const store = (await db.select().from(stores).where(eq(stores.ownerUserId, userId)).orderBy(desc(stores.id)).limit(1))[0];
  if (!store) return null;
  await db.insert(storeMembers).values({ storeId: store.id, userId, role: "owner", status: "active" });
  const membership = (await db.select().from(storeMembers).where(and(eq(storeMembers.storeId, store.id), eq(storeMembers.userId, userId))).limit(1))[0];
  return membership ? { store, membership } : null;
}

export async function getSnapshotForUser(userId: number): Promise<{ snapshot: Record<string, unknown>; version: number; updatedAt: Date } | null> {
  const workspace = await getWorkspaceForUser(userId);
  if (!workspace) return null;
  const db = await getDb();
  if (!db) return null;
  const row = (await db.select().from(posSnapshots).where(eq(posSnapshots.storeId, workspace.store.id)).limit(1))[0];
  if (!row) return null;
  try {
    return { snapshot: JSON.parse(row.snapshotJson) as Record<string, unknown>, version: row.version, updatedAt: row.updatedAt };
  } catch {
    return null;
  }
}

export class SnapshotConflictError extends Error {
  constructor(public readonly currentVersion: number) {
    super("Dữ liệu cloud đã được thay đổi trên thiết bị khác.");
    this.name = "SnapshotConflictError";
  }
}

export async function upsertSnapshotForUser(userId: number, snapshot: Record<string, unknown>, clientVersion?: number) {
  const workspace = await ensureWorkspaceForUser(userId);
  if (!workspace) throw new Error("Cloud database is not available");
  const db = await getDb();
  if (!db) throw new Error("Cloud database is not available");
  const current = (await db.select().from(posSnapshots).where(eq(posSnapshots.storeId, workspace.store.id)).limit(1))[0];
  const currentVersion = current?.version ?? 0;
  if (clientVersion !== undefined && clientVersion !== currentVersion) throw new SnapshotConflictError(currentVersion);
  const version = currentVersion + 1;
  if (current) {
    await db.insert(snapshotBackups).values({ storeId: workspace.store.id, sourceVersion: current.version, snapshotJson: current.snapshotJson, createdByUserId: userId });
  }
  await db.insert(posSnapshots).values({ storeId: workspace.store.id, version, snapshotJson: JSON.stringify(snapshot), updatedByUserId: userId }).onDuplicateKeyUpdate({ set: { version, snapshotJson: JSON.stringify(snapshot), updatedByUserId: userId, updatedAt: new Date() } });
  await appendAuditLog(userId, workspace.store.id, "snapshot_sync", "pos_snapshot", String(workspace.store.id), { version, baseVersion: currentVersion });
  return { version, storeId: workspace.store.id };
}

export async function listSnapshotBackupsForUser(userId: number, limit = 20) {
  const workspace = await getWorkspaceForUser(userId);
  if (!workspace) return [];
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: snapshotBackups.id, sourceVersion: snapshotBackups.sourceVersion, createdAt: snapshotBackups.createdAt }).from(snapshotBackups).where(eq(snapshotBackups.storeId, workspace.store.id)).orderBy(desc(snapshotBackups.id)).limit(Math.min(Math.max(limit, 1), 100));
}

export async function restoreSnapshotBackupForUser(userId: number, backupId: number) {
  const workspace = await ensureWorkspaceForUser(userId);
  if (!workspace) throw new Error("Cloud database is not available");
  const db = await getDb();
  if (!db) throw new Error("Cloud database is not available");
  const backup = (await db.select().from(snapshotBackups).where(and(eq(snapshotBackups.id, backupId), eq(snapshotBackups.storeId, workspace.store.id))).limit(1))[0];
  if (!backup) throw new Error("Không tìm thấy bản sao lưu trong workspace này.");
  const current = (await db.select().from(posSnapshots).where(eq(posSnapshots.storeId, workspace.store.id)).limit(1))[0];
  const version = (current?.version ?? 0) + 1;
  if (current) await db.insert(snapshotBackups).values({ storeId: workspace.store.id, sourceVersion: current.version, snapshotJson: current.snapshotJson, createdByUserId: userId });
  await db.insert(posSnapshots).values({ storeId: workspace.store.id, version, snapshotJson: backup.snapshotJson, updatedByUserId: userId }).onDuplicateKeyUpdate({ set: { version, snapshotJson: backup.snapshotJson, updatedByUserId: userId, updatedAt: new Date() } });
  await appendAuditLog(userId, workspace.store.id, "snapshot_restore", "pos_snapshot", String(workspace.store.id), { version, restoredFrom: backup.sourceVersion });
  return { version, storeId: workspace.store.id, snapshot: JSON.parse(backup.snapshotJson) as Record<string, unknown> };
}

export async function appendAuditLog(actorUserId: number, storeId: number, action: string, entityType: string, entityId?: string, metadata?: Record<string, unknown>) {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditLogs).values({ storeId, actorUserId, action, entityType, entityId: entityId ?? null, metadataJson: metadata ? JSON.stringify(metadata) : null });
}

export async function updateStoreTypeForUser(userId: number, storeType: "solo" | "withStaff") {
  const workspace = await getWorkspaceForUser(userId);
  if (!workspace || workspace.membership.role !== "owner") return null;
  const db = await getDb();
  if (!db) throw new Error("Cloud database is not available");
  await db.update(stores).set({ storeType, storeSetupCompleted: true }).where(eq(stores.id, workspace.store.id));
  await appendAuditLog(userId, workspace.store.id, "store_type_update", "store", String(workspace.store.id), { storeType });
  return (await db.select().from(stores).where(eq(stores.id, workspace.store.id)).limit(1))[0] ?? null;
}

export async function getStoreById(storeId: number) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(stores).where(eq(stores.id, storeId)).limit(1))[0];
}

export async function getStoreMemberById(storeId: number, memberId: number) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(storeMembers).where(and(eq(storeMembers.id, memberId), eq(storeMembers.storeId, storeId))).limit(1))[0];
}

export async function updateStoreMemberPinState(memberId: number, values: { pinFailedAttempts?: number; pinLockedUntil?: Date | null }) {
  const db = await getDb();
  if (!db) throw new Error("Cloud database is not available");
  await db.update(storeMembers).set(values).where(eq(storeMembers.id, memberId));
}

export async function createStoreStaff(ownerUserId: number, input: { name: string; kind: "email" | "phone"; identifier: string; password: string; pinHash: string }) {
  const workspace = await getWorkspaceForUser(ownerUserId);
  if (!workspace || workspace.membership.role !== "owner") return null;
  const db = await getDb();
  if (!db) throw new Error("Cloud database is not available");
  const identifierOwner = input.kind === "email" ? await getUserByEmail(input.identifier) : await getUserByPhone(input.identifier);
  if (identifierOwner?.passwordHash) throw new Error("Thông tin đăng nhập đã tồn tại.");
  const openId = identifierOwner?.openId ?? credentialsOpenId(input.kind, input.identifier);
  await upsertUser({ openId, name: input.name, email: input.kind === "email" ? input.identifier : identifierOwner?.email ?? null, phone: input.kind === "phone" ? input.identifier : identifierOwner?.phone ?? null, passwordHash: hashPassword(input.password), loginMethod: input.kind === "email" ? "credentials_email" : "credentials_phone", lastSignedIn: new Date() });
  const user = await getUserByOpenId(openId);
  if (!user) throw new Error("Không thể tạo tài khoản nhân viên.");
  const existingMembership = (await db.select().from(storeMembers).where(and(eq(storeMembers.storeId, workspace.store.id), eq(storeMembers.userId, user.id))).limit(1))[0];
  if (existingMembership) throw new Error("Tài khoản này đã là thành viên của quán.");
  const result = await db.insert(storeMembers).values({ storeId: workspace.store.id, userId: user.id, role: "staff", status: "active", pinHash: input.pinHash });
  const memberId = Number((result as { insertId?: number | bigint }).insertId ?? 0);
  await appendAuditLog(ownerUserId, workspace.store.id, "staff_create", "store_member", String(memberId), { userId: user.id, kind: input.kind });
  return { id: Number((result as { insertId?: number | bigint }).insertId ?? 0), userId: user.id, name: user.name, email: user.email, phone: user.phone, role: "staff" as const, status: "active" as const };
}

export async function updateStoreStaff(ownerUserId: number, memberId: number, values: { status?: "active" | "disabled"; pinHash?: string }) {
  const workspace = await getWorkspaceForUser(ownerUserId);
  if (!workspace || workspace.membership.role !== "owner") return null;
  const member = await getStoreMemberById(workspace.store.id, memberId);
  if (!member || member.role !== "staff") return null;
  const db = await getDb();
  if (!db) throw new Error("Cloud database is not available");
  await db.update(storeMembers).set({ ...values, pinFailedAttempts: 0, pinLockedUntil: null }).where(and(eq(storeMembers.id, memberId), eq(storeMembers.storeId, workspace.store.id)));
  await appendAuditLog(ownerUserId, workspace.store.id, values.pinHash ? "staff_pin_reset" : values.status === "disabled" ? "staff_disable" : "staff_enable", "store_member", String(memberId));
  return getStoreMemberById(workspace.store.id, memberId);
}

export async function listAuditLogsForUser(userId: number, limit = 100) {
  const workspace = await getWorkspaceForUser(userId);
  if (!workspace || workspace.membership.role !== "owner") return [];
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: auditLogs.id, actorUserId: auditLogs.actorUserId, actorName: users.name, action: auditLogs.action, entityType: auditLogs.entityType, entityId: auditLogs.entityId, metadataJson: auditLogs.metadataJson, createdAt: auditLogs.createdAt }).from(auditLogs).innerJoin(users, eq(users.id, auditLogs.actorUserId)).where(eq(auditLogs.storeId, workspace.store.id)).orderBy(desc(auditLogs.id)).limit(Math.min(Math.max(limit, 1), 200));
}

export async function listStoreMembers(userId: number) {
  const workspace = await getWorkspaceForUser(userId);
  if (!workspace) return [];
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: storeMembers.id, userId: users.id, name: users.name, email: users.email, phone: users.phone, role: storeMembers.role, status: storeMembers.status, createdAt: storeMembers.createdAt }).from(storeMembers).innerJoin(users, eq(users.id, storeMembers.userId)).where(eq(storeMembers.storeId, workspace.store.id)).orderBy(desc(storeMembers.id));
}
