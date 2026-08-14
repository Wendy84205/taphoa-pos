import { int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/** Một quán/tài khoản kinh doanh độc lập trong hệ thống cloud. */
export const stores = mysqlTable("stores", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  ownerUserId: int("ownerUserId").notNull(),
  subscriptionPlan: varchar("subscriptionPlan", { length: 32 }).default("free").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Store = typeof stores.$inferSelect;
export type InsertStore = typeof stores.$inferInsert;

/** Thành viên của quán. Role staff không được sửa giá hoặc xóa hóa đơn. */
export const storeMembers = mysqlTable("storeMembers", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["owner", "staff"]).default("staff").notNull(),
  status: mysqlEnum("status", ["active", "invited", "disabled"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ membershipUnique: uniqueIndex("store_members_store_user_unique").on(table.storeId, table.userId) }));

export type StoreMember = typeof storeMembers.$inferSelect;
export type InsertStoreMember = typeof storeMembers.$inferInsert;

/** Snapshot JSON giúp giữ toàn bộ nghiệp vụ offline hiện tại trong giai đoạn cloud MVP. */
export const posSnapshots = mysqlTable("posSnapshots", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull().unique(),
  version: int("version").default(1).notNull(),
  snapshotJson: text("snapshotJson").notNull(),
  updatedByUserId: int("updatedByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PosSnapshot = typeof posSnapshots.$inferSelect;
export type InsertPosSnapshot = typeof posSnapshots.$inferInsert;

export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  actorUserId: int("actorUserId").notNull(),
  action: varchar("action", { length: 64 }).notNull(),
  entityType: varchar("entityType", { length: 64 }).notNull(),
  entityId: varchar("entityId", { length: 128 }),
  metadataJson: text("metadataJson"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;
