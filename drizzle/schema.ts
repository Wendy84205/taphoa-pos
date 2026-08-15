import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  passwordHash: text("passwordHash"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
}, (table) => ({
  emailUnique: uniqueIndex("users_email_unique").on(table.email),
  phoneUnique: uniqueIndex("users_phone_unique").on(table.phone),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/** Bảng lịch sử legacy; không còn route hay UI OTP/SMS nào gọi đến. Giữ nguyên để migration không xóa dữ liệu cũ. */
export const authChallenges = mysqlTable("authChallenges", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  identifier: varchar("identifier", { length: 320 }).notNull(),
  channel: mysqlEnum("channel", ["sms", "email"]).notNull(),
  purpose: mysqlEnum("purpose", ["login_otp", "reset_password"]).notNull(),
  codeHash: text("codeHash").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  attempts: int("attempts").default(0).notNull(),
  consumedAt: timestamp("consumedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/** Một quán/tài khoản kinh doanh độc lập trong hệ thống cloud. */
export const stores = mysqlTable("stores", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  ownerUserId: int("ownerUserId").notNull(),
  subscriptionPlan: varchar("subscriptionPlan", { length: 32 }).default("free").notNull(),
  storeType: mysqlEnum("storeType", ["solo", "withStaff"]).default("solo").notNull(),
  storeSetupCompleted: boolean("storeSetupCompleted").default(false).notNull(),
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
  pinHash: text("pinHash"),
  pinFailedAttempts: int("pinFailedAttempts").default(0).notNull(),
  pinLockedUntil: timestamp("pinLockedUntil"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ membershipUnique: uniqueIndex("store_members_store_user_unique").on(table.storeId, table.userId) }));

export type StoreMember = typeof storeMembers.$inferSelect;
export type InsertStoreMember = typeof storeMembers.$inferInsert;

/** Lời mời nhân viên theo tenant, hỗ trợ email hoặc số điện thoại. */
export const storeInvitations = mysqlTable("storeInvitations", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  identifier: varchar("identifier", { length: 320 }).notNull(),
  kind: mysqlEnum("kind", ["email", "phone"]).notNull(),
  role: mysqlEnum("role", ["staff"]).default("staff").notNull(),
  status: mysqlEnum("status", ["pending", "accepted", "expired", "revoked"]).default("pending").notNull(),
  tokenHash: text("tokenHash").notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StoreInvitation = typeof storeInvitations.$inferSelect;
export type InsertStoreInvitation = typeof storeInvitations.$inferInsert;

/** Quyền sử dụng duy nhất cho từng tenant. Server là nguồn quyết định quyền, không tin trạng thái client. */
export const storeEntitlements = mysqlTable("storeEntitlements", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  planCode: varchar("planCode", { length: 64 }).default("trial").notNull(),
  status: mysqlEnum("status", ["trialing", "active", "past_due", "grace", "canceled", "expired", "legacy"]).default("trialing").notNull(),
  source: mysqlEnum("source", ["trial", "stripe", "apple", "google_play", "manual", "legacy"]).default("trial").notNull(),
  trialStartedAt: timestamp("trialStartedAt"),
  trialEndsAt: timestamp("trialEndsAt"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  graceEndsAt: timestamp("graceEndsAt"),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  cancelAtPeriodEnd: boolean("cancelAtPeriodEnd").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  storeUnique: uniqueIndex("store_entitlements_store_unique").on(table.storeId),
  stripeCustomerUnique: uniqueIndex("store_entitlements_stripe_customer_unique").on(table.stripeCustomerId),
  stripeSubscriptionUnique: uniqueIndex("store_entitlements_stripe_subscription_unique").on(table.stripeSubscriptionId),
}));

export type StoreEntitlement = typeof storeEntitlements.$inferSelect;
export type InsertStoreEntitlement = typeof storeEntitlements.$inferInsert;

/** Nhật ký idempotent cho event billing; không lưu payload thanh toán thô hay thông tin thẻ. */
export const billingWebhookEvents = mysqlTable("billingWebhookEvents", {
  id: int("id").autoincrement().primaryKey(),
  provider: mysqlEnum("provider", ["stripe", "apple", "google_play"]).notNull(),
  providerEventId: varchar("providerEventId", { length: 255 }).notNull(),
  eventType: varchar("eventType", { length: 128 }).notNull(),
  storeId: int("storeId"),
  payloadHash: varchar("payloadHash", { length: 64 }).notNull(),
  processingStatus: mysqlEnum("processingStatus", ["processed", "ignored", "failed"]).default("processed").notNull(),
  processedAt: timestamp("processedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({ providerEventUnique: uniqueIndex("billing_webhook_provider_event_unique").on(table.provider, table.providerEventId) }));

export type BillingWebhookEvent = typeof billingWebhookEvents.$inferSelect;
export type InsertBillingWebhookEvent = typeof billingWebhookEvents.$inferInsert;

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

/** Lịch sử snapshot bất biến để chủ quán có thể khôi phục dữ liệu cloud. */
export const snapshotBackups = mysqlTable("snapshotBackups", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  sourceVersion: int("sourceVersion").notNull(),
  snapshotJson: text("snapshotJson").notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SnapshotBackup = typeof snapshotBackups.$inferSelect;
export type InsertSnapshotBackup = typeof snapshotBackups.$inferInsert;

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
