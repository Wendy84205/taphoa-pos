import { describe, expect, it } from "vitest";
import { TRIAL_DAYS, addTrialDays, resolveEntitlement } from "../server/entitlements";

const start = new Date("2026-08-15T00:00:00.000Z");

describe("entitlement lifecycle", () => {
  it("grants exactly a 15-day trial for new tenants", () => {
    expect(addTrialDays(start)).toEqual(new Date("2026-08-30T00:00:00.000Z"));
    expect(TRIAL_DAYS).toBe(15);
  });

  it("allows a tenant during trial and rejects it after the server expiry time", () => {
    const record = {
      storeId: 7,
      planCode: "trial",
      status: "trialing" as const,
      source: "trial" as const,
      trialStartedAt: start,
      trialEndsAt: addTrialDays(start),
      currentPeriodEnd: null,
      graceEndsAt: null,
      cancelAtPeriodEnd: false,
    };
    expect(resolveEntitlement(record, new Date("2026-08-29T23:59:59.000Z"))).toMatchObject({ canAccess: true, reason: "trial" });
    expect(resolveEntitlement(record, new Date("2026-08-30T00:00:00.000Z"))).toMatchObject({ canAccess: false, status: "expired", reason: "expired" });
  });

  it("keeps paid users active through their current paid period and supports a grace window", () => {
    const base = {
      storeId: 7,
      planCode: "pro_monthly",
      source: "stripe" as const,
      trialStartedAt: null,
      trialEndsAt: null,
      currentPeriodEnd: new Date("2026-09-15T00:00:00.000Z"),
      graceEndsAt: new Date("2026-09-20T00:00:00.000Z"),
      cancelAtPeriodEnd: true,
    };
    expect(resolveEntitlement({ ...base, status: "active" }, start)).toMatchObject({ canAccess: true, reason: "subscription" });
    expect(resolveEntitlement({ ...base, status: "grace" }, new Date("2026-09-18T00:00:00.000Z"))).toMatchObject({ canAccess: true, reason: "grace" });
    expect(resolveEntitlement({ ...base, status: "past_due" }, new Date("2026-09-21T00:00:00.000Z"))).toMatchObject({ canAccess: false, reason: "payment_required" });
  });

  it("does not revoke existing tenants that predate the entitlement migration", () => {
    expect(resolveEntitlement(null, start)).toMatchObject({ canAccess: true, status: "legacy", reason: "legacy" });
  });
});
