import "server-only";
import Stripe from "stripe";
import { PACKS, PLANS } from "./billing";
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

/** Prices of the catalogue, by lookup key (cached 10 minutes). */
export async function catalogPrices(): Promise<Map<string, Stripe.Price>> {
  if (priceCache && Date.now() - priceCache.at < 10 * 60 * 1000) return priceCache.byKey;
  const keys = [...PLANS, ...PACKS].map((x) => x.lookupKey);
  const res = await stripe().prices.list({ lookup_keys: keys, active: true, limit: 100 });
  const byKey = new Map(res.data.map((p) => [p.lookup_key!, p]));
  const missing = keys.filter((k) => !byKey.has(k));
  if (missing.length) throw new Error(`Stripe catalogue incomplete (${missing.join(", ")}): run npm run stripe:setup`);
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
/** The portal configuration created by `npm run stripe:setup` (plan switching enabled). */
export async function portalConfigurationId(): Promise<string | undefined> {
  if (portalConfig === undefined) {
    const list = await stripe().billingPortal.configurations.list({ limit: 100, active: true });
    portalConfig = list.data.find((c) => c.metadata?.takely === "true")?.id ?? null;
  }
  return portalConfig ?? undefined;
}
