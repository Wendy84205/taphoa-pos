export const BILLING_PLAN_CODES = ["starter_monthly", "pro_monthly"] as const;
export type BillingPlanCode = (typeof BILLING_PLAN_CODES)[number];

export type StripeBillingConfig = {
  secretKey: string;
  webhookSecret: string;
  appBaseUrl: string;
  priceByPlan: Record<BillingPlanCode, string>;
};

type BillingEnvironment = Record<string, string | undefined>;

function required(env: BillingEnvironment, key: string): string | null {
  const value = env[key]?.trim();
  return value ? value : null;
}

/** Trả null khi môi trường chưa đủ cấu hình; không được tự chuyển sang charge thật hoặc giá client-provided. */
export function getStripeBillingConfig(env: BillingEnvironment = process.env): StripeBillingConfig | null {
  const secretKey = required(env, "PAYMENTS_STRIPE_SECRET_KEY");
  const webhookSecret = required(env, "PAYMENTS_STRIPE_WEBHOOK_SECRET");
  const appBaseUrl = required(env, "APP_BASE_URL")?.replace(/\/+$/, "");
  const starterPrice = required(env, "STRIPE_PRICE_STARTER_MONTHLY");
  const proPrice = required(env, "STRIPE_PRICE_PRO_MONTHLY");
  if (!secretKey || !webhookSecret || !appBaseUrl || !starterPrice || !proPrice) return null;
  if (!/^https:\/\//.test(appBaseUrl)) return null;
  return {
    secretKey,
    webhookSecret,
    appBaseUrl,
    priceByPlan: { starter_monthly: starterPrice, pro_monthly: proPrice },
  };
}

export function isBillingPlanCode(value: string): value is BillingPlanCode {
  return (BILLING_PLAN_CODES as readonly string[]).includes(value);
}
