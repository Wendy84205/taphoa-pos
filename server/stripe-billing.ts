import crypto from "crypto";
import type { Express, Request, Response } from "express";
import express from "express";
import Stripe from "stripe";

import { getStripeBillingConfig, isBillingPlanCode, type BillingPlanCode } from "./billing-config";
import * as db from "./db";

type StripeSubscriptionLike = {
  id: string;
  customer: string | { id: string };
  status: string;
  cancel_at_period_end?: boolean;
  current_period_end?: number;
  items?: { data?: Array<{ price?: { id?: string } }> };
  metadata?: Record<string, string>;
};

function getStripeClient(): { stripe: Stripe; config: NonNullable<ReturnType<typeof getStripeBillingConfig>> } | null {
  const config = getStripeBillingConfig();
  return config ? { stripe: new Stripe(config.secretKey), config } : null;
}

function unixTimestampToDate(value: number | undefined): Date | null {
  return typeof value === "number" && Number.isFinite(value) ? new Date(value * 1000) : null;
}

function planFromSubscription(subscription: StripeSubscriptionLike, priceByPlan: Record<BillingPlanCode, string>): BillingPlanCode | null {
  const priceId = subscription.items?.data?.[0]?.price?.id;
  return (Object.keys(priceByPlan) as BillingPlanCode[]).find((plan) => priceByPlan[plan] === priceId) ?? null;
}

function storeIdFromMetadata(metadata?: Record<string, string>): number | null {
  const candidate = Number(metadata?.storeId);
  return Number.isSafeInteger(candidate) && candidate > 0 ? candidate : null;
}

async function ensureStripeCustomer(input: { stripe: Stripe; storeId: number; email: string | null; name: string | null }) {
  const entitlement = await db.getStoreEntitlement(input.storeId);
  if (entitlement?.stripeCustomerId) return entitlement.stripeCustomerId;
  const customer = await input.stripe.customers.create({
    email: input.email ?? undefined,
    name: input.name ?? undefined,
    metadata: { storeId: String(input.storeId) },
  });
  await db.setStripeCustomerForStore(input.storeId, customer.id);
  return customer.id;
}

export async function createStripeCheckout(input: { storeId: number; ownerEmail: string | null; ownerName: string | null; planCode: BillingPlanCode }) {
  const configured = getStripeClient();
  if (!configured) throw new Error("STRIPE_NOT_CONFIGURED");
  const customer = await ensureStripeCustomer({ stripe: configured.stripe, storeId: input.storeId, email: input.ownerEmail, name: input.ownerName });
  const session = await configured.stripe.checkout.sessions.create({
    mode: "subscription",
    customer,
    line_items: [{ price: configured.config.priceByPlan[input.planCode], quantity: 1 }],
    success_url: `${configured.config.appBaseUrl}/tai-khoan?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${configured.config.appBaseUrl}/bang-gia?checkout=cancelled`,
    allow_promotion_codes: false,
    client_reference_id: String(input.storeId),
    metadata: { storeId: String(input.storeId), planCode: input.planCode },
    subscription_data: { metadata: { storeId: String(input.storeId), planCode: input.planCode } },
  });
  if (!session.url) throw new Error("STRIPE_CHECKOUT_URL_MISSING");
  return { url: session.url };
}

export async function createStripeBillingPortal(input: { storeId: number }) {
  const configured = getStripeClient();
  if (!configured) throw new Error("STRIPE_NOT_CONFIGURED");
  const entitlement = await db.getStoreEntitlement(input.storeId);
  if (!entitlement?.stripeCustomerId) throw new Error("STRIPE_CUSTOMER_NOT_FOUND");
  const session = await configured.stripe.billingPortal.sessions.create({
    customer: entitlement.stripeCustomerId,
    return_url: `${configured.config.appBaseUrl}/tai-khoan`,
  });
  return { url: session.url };
}

async function syncStripeSubscription(subscription: StripeSubscriptionLike, config: NonNullable<ReturnType<typeof getStripeBillingConfig>>) {
  const storeId = storeIdFromMetadata(subscription.metadata);
  if (!storeId) return;
  const planCode = planFromSubscription(subscription, config.priceByPlan) ?? "starter_monthly";
  const currentPeriodEnd = unixTimestampToDate(subscription.current_period_end);
  const source = "stripe" as const;
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const status = subscription.status;
  if (status === "active" || status === "trialing") {
    await db.upsertStripeEntitlement(storeId, { planCode, status: "active", source, currentPeriodEnd, graceEndsAt: null, stripeCustomerId: customerId, stripeSubscriptionId: subscription.id, cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end) });
    return;
  }
  if (status === "past_due" || status === "unpaid") {
    const graceEndsAt = currentPeriodEnd ? new Date(currentPeriodEnd.getTime() + 3 * 24 * 60 * 60 * 1000) : null;
    await db.upsertStripeEntitlement(storeId, { planCode, status: "grace", source, currentPeriodEnd, graceEndsAt, stripeCustomerId: customerId, stripeSubscriptionId: subscription.id, cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end) });
    return;
  }
  await db.upsertStripeEntitlement(storeId, { planCode, status: "canceled", source, currentPeriodEnd, graceEndsAt: null, stripeCustomerId: customerId, stripeSubscriptionId: subscription.id, cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end) });
}

async function handleStripeEvent(event: Stripe.Event) {
  const configured = getStripeClient();
  if (!configured) throw new Error("STRIPE_NOT_CONFIGURED");
  if (await db.hasBillingWebhookEvent("stripe", event.id)) return;

  let storeId: number | null = null;
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    storeId = storeIdFromMetadata(session.metadata ?? undefined) ?? (session.client_reference_id ? Number(session.client_reference_id) : null);
    if (storeId && typeof session.customer === "string") await db.setStripeCustomerForStore(storeId, session.customer);
  }
  if (event.type.startsWith("customer.subscription.")) {
    const subscription = event.data.object as unknown as StripeSubscriptionLike;
    storeId = storeIdFromMetadata(subscription.metadata);
    await syncStripeSubscription(subscription, configured.config);
  }
  const payloadHash = crypto.createHash("sha256").update(JSON.stringify(event.data.object)).digest("hex");
  await db.recordBillingWebhookEvent({ provider: "stripe", providerEventId: event.id, eventType: event.type, storeId, payloadHash, processingStatus: "processed" });
}

/** Route raw body phải đăng ký trước express.json để Stripe có thể xác minh chữ ký. */
export function registerStripeWebhookRoute(app: Express) {
  app.post("/api/billing/stripe/webhook", express.raw({ type: "application/json", limit: "1mb" }), async (req: Request, res: Response) => {
    const configured = getStripeClient();
    if (!configured) return res.status(503).json({ error: "Stripe billing chưa được cấu hình." });
    const signature = req.header("stripe-signature");
    if (!signature || !Buffer.isBuffer(req.body)) return res.status(400).json({ error: "Stripe webhook không hợp lệ." });
    try {
      const event = configured.stripe.webhooks.constructEvent(req.body, signature, configured.config.webhookSecret);
      await handleStripeEvent(event);
      return res.status(200).json({ received: true });
    } catch (error) {
      const status = error instanceof Stripe.errors.StripeSignatureVerificationError ? 400 : 500;
      return res.status(status).json({ error: status === 400 ? "Chữ ký Stripe webhook không hợp lệ." : "Không thể xử lý Stripe webhook." });
    }
  });
}

export function stripeBillingReady() {
  return Boolean(getStripeBillingConfig());
}

export function parseBillingPlan(value: string): BillingPlanCode | null {
  return isBillingPlanCode(value) ? value : null;
}
