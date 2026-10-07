import "server-only";
import Stripe from "stripe";
import { PACKS, PLANS } from "./billing";
import { appUrl } from "./fal";
import { ensureCatalog, ensureWebhook } from "./stripe-catalog";
import { supabaseAdmin } from "./supabase/server";

let client: Stripe | null = null;

/** One Stripe client per server instance. Use a restricted key (rk_…) in production. */
export function stripe(): Stripe {
  client ??= new Stripe(process.env.STRIPE_SECRET_KEY!);
  return client;
}

/**
 * Label attached to every Checkout Session so Takely's flows can be compared in the
 * Stripe Dashboard (fixed suffix of 8 random letters, as Stripe recommends).
 */
export const INTEGRATION_ID = "takely-web-checkout-qmvhrtza";

/** Stripe Tax is only switched on once a VAT registration is active in Stripe (see README). */
export const automaticTax = () => process.env.STRIPE_AUTOMATIC_TAX === "true";

let priceCache: { at: number; byKey: Map<string, Stripe.Price> } | null = null;
const ALL_KEYS = [...PLANS, ...PACKS].map((x) => x.lookupKey);

async function fetchPrices() {
  const res = await stripe().prices.list({ lookup_keys: ALL_KEYS, active: true, limit: 100 });
  return new Map(res.data.map((p) => [p.lookup_key!, p]));
}

/** Prices of the catalogue, by lookup key (cached 10 minutes; created on first use if missing). */
export async function catalogPrices(): Promise<Map<string, Stripe.Price>> {
  if (priceCache && Date.now() - priceCache.at < 10 * 60 * 1000) return priceCache.byKey;
  let byKey = await fetchPrices();
  if (ALL_KEYS.some((k) => !byKey.has(k))) {
    await ensureCatalog(stripe(), appUrl());
    portalConfig = undefined;
    byKey = await fetchPrices();
  }
  priceCache = { at: Date.now(), byKey };
  return byKey;
}

export async function priceIdFor(lookupKey: string): Promise<string> {
  return (await catalogPrices()).get(lookupKey)!.id;
}

/** Lookup key of a price id seen in an event (null if it isn't one of ours). */
export async function lookupKeyForPrice(priceId: string | null | undefined): Promise<string | null> {
  if (!priceId) return null;
  for (const [key, p] of await catalogPrices()) if (p.id === priceId) return key;
  const p = await stripe().prices.retrieve(priceId);
  return p.lookup_key ?? null;
}

/** Returns the user's Stripe customer, creating and saving it the first time. */
export async function customerFor(userId: string, email: string | undefined): Promise<string> {
  const sb = supabaseAdmin();
  const { data: profile } = await sb.from("profiles").select("stripe_customer_id").eq("id", userId).single();
  if (profile?.stripe_customer_id) return profile.stripe_customer_id;
  const customer = await stripe().customers.create(
    { email, metadata: { user_id: userId } },
    { idempotencyKey: `customer-${userId}` },
  );
  await sb.from("profiles").update({ stripe_customer_id: customer.id }).eq("id", userId);
  return customer.id;
}

/** Finds our user from a Stripe customer id (fallback when an object carries no metadata). */
export async function userForCustomer(customerId: string | null | undefined): Promise<string | null> {
  if (!customerId) return null;
  const { data } = await supabaseAdmin().from("profiles").select("id").eq("stripe_customer_id", customerId).maybeSingle();
  return data?.id ?? null;
}

let portalConfig: string | null | undefined;
/** The portal configuration with plan switching (created with the catalogue). */
export async function portalConfigurationId(): Promise<string | undefined> {
  if (portalConfig === undefined) {
    const list = await stripe().billingPortal.configurations.list({ limit: 100, active: true });
    portalConfig = list.data.find((c) => c.metadata?.takely === "true")?.id ?? null;
    if (!portalConfig) portalConfig = (await ensureCatalog(stripe(), appUrl())).portalConfigurationId;
  }
  return portalConfig ?? undefined;
}

const SECRET_KEY = "stripe_webhook_secret";

/** Webhook signing secret: STRIPE_WEBHOOK_SECRET, or the one saved when the app created the endpoint. */
export async function webhookSecret(): Promise<string | null> {
  if (process.env.STRIPE_WEBHOOK_SECRET) return process.env.STRIPE_WEBHOOK_SECRET;
  const { data } = await supabaseAdmin().from("app_settings").select("value").eq("key", SECRET_KEY).maybeSingle();
  return data?.value ?? null;
}

let ready = false;
/**
 * First use of Stripe on a fresh deployment: creates the catalogue, the portal settings and
 * (unless STRIPE_WEBHOOK_SECRET is set) the webhook endpoint, saving its secret privately.
 */
export async function ensureStripeReady() {
  if (ready) return;
  await catalogPrices();
  await portalConfigurationId();
  const url = appUrl();
  if (!process.env.STRIPE_WEBHOOK_SECRET && !url.includes("localhost")) {
    const secret = await ensureWebhook(stripe(), url, !!(await webhookSecret()));
    if (secret) {
      await supabaseAdmin()
        .from("app_settings")
        .upsert({ key: SECRET_KEY, value: secret, updated_at: new Date().toISOString() });
    }
  }
  ready = true;
}
