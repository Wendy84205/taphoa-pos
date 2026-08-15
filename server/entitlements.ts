export const TRIAL_DAYS = 15;

export type EntitlementStatus = "trialing" | "active" | "past_due" | "grace" | "canceled" | "expired" | "legacy";
export type EntitlementSource = "trial" | "stripe" | "apple" | "google_play" | "manual" | "legacy";

export type EntitlementRecord = {
  storeId: number;
  planCode: string;
  status: EntitlementStatus;
  source: EntitlementSource;
  trialStartedAt: Date | null;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
  graceEndsAt: Date | null;
  cancelAtPeriodEnd: boolean;
};

export type EntitlementSummary = EntitlementRecord & {
  canAccess: boolean;
  accessEndsAt: Date | null;
  reason: "trial" | "subscription" | "grace" | "legacy" | "expired" | "payment_required";
};

export function addTrialDays(startedAt: Date, days = TRIAL_DAYS): Date {
  const endsAt = new Date(startedAt);
  endsAt.setUTCDate(endsAt.getUTCDate() + days);
  return endsAt;
}

function isFuture(value: Date | null, now: Date): boolean {
  return Boolean(value && value.getTime() > now.getTime());
}

/** Quy tắc thuần, dễ test: entitlement được quyết định bằng server timestamp thay vì đồng hồ client. */
export function resolveEntitlement(record: EntitlementRecord | null, now = new Date()): EntitlementSummary {
  if (!record) {
    return {
      storeId: 0,
      planCode: "legacy",
      status: "legacy",
      source: "legacy",
      trialStartedAt: null,
      trialEndsAt: null,
      currentPeriodEnd: null,
      graceEndsAt: null,
      cancelAtPeriodEnd: false,
      canAccess: true,
      accessEndsAt: null,
      reason: "legacy",
    };
  }

  if (record.status === "legacy") return { ...record, canAccess: true, accessEndsAt: null, reason: "legacy" };
  if (record.status === "trialing") {
    const canAccess = isFuture(record.trialEndsAt, now);
    return { ...record, canAccess, accessEndsAt: record.trialEndsAt, reason: canAccess ? "trial" : "expired", status: canAccess ? "trialing" : "expired" };
  }
  if (record.status === "active" || record.status === "canceled") {
    const canAccess = isFuture(record.currentPeriodEnd, now);
    return { ...record, canAccess, accessEndsAt: record.currentPeriodEnd, reason: canAccess ? "subscription" : "expired", status: canAccess ? record.status : "expired" };
  }
  if (record.status === "grace" || record.status === "past_due") {
    const canAccess = isFuture(record.graceEndsAt, now);
    return { ...record, canAccess, accessEndsAt: record.graceEndsAt, reason: canAccess ? "grace" : "payment_required", status: canAccess ? "grace" : "expired" };
  }
  return { ...record, canAccess: false, accessEndsAt: record.currentPeriodEnd ?? record.trialEndsAt, reason: "expired" };
}
