import { describe, expect, it } from "vitest";
import { getStripeBillingConfig, isBillingPlanCode } from "../server/billing-config";

const completeEnv = {
  PAYMENTS_STRIPE_SECRET_KEY: "sk_test_example",
  PAYMENTS_STRIPE_WEBHOOK_SECRET: "whsec_example",
  APP_BASE_URL: "https://pos.example.com/",
  STRIPE_PRICE_STARTER_MONTHLY: "price_starter",
  STRIPE_PRICE_PRO_MONTHLY: "price_pro",
};

describe("Stripe billing configuration", () => {
  it("remains disabled until every server-side Stripe configuration value is present", () => {
    expect(getStripeBillingConfig({ APP_BASE_URL: "https://pos.example.com" })).toBeNull();
    expect(getStripeBillingConfig({ ...completeEnv, APP_BASE_URL: "http://pos.example.com" })).toBeNull();
  });

  it("uses only server-configured plan price IDs and normalizes the base URL", () => {
    expect(getStripeBillingConfig(completeEnv)).toMatchObject({
      appBaseUrl: "https://pos.example.com",
      priceByPlan: { starter_monthly: "price_starter", pro_monthly: "price_pro" },
    });
    expect(isBillingPlanCode("starter_monthly")).toBe(true);
    expect(isBillingPlanCode("forged_client_price")).toBe(false);
  });
});
