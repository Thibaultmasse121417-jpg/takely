/**
 * Creates or updates Takely's Stripe catalogue (one Product + Price per plan and pack),
 * the customer-portal configuration and the webhook endpoint. Idempotent. Used both by
 * `npm run stripe:setup` and automatically by the app the first time it needs Stripe.
 */
import type Stripe from "stripe";
import { CURRENCY, PACKS, PLANS, lookupKey, type Interval } from "./billing";

export const WEBHOOK_EVENTS: Stripe.WebhookEndpointCreateParams.EnabledEvent[] = [
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
  "invoice.paid",
  "invoice.payment_failed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
];

type PriceDef = { lookupKey: string; amount: number; interval: Interval | null };
type ProductDef = { takelyId: string; name: string; description: string; prices: PriceDef[]; plan: boolean };

const PRODUCTS: ProductDef[] = [
  ...PLANS.map((p) => ({
    takelyId: `plan:${p.id}`,
    name: `Takely ${p.name}`,
    description: `${p.monthlyCredits} crédits par mois pour créer des pubs, vidéos et images IA.`,
    plan: true,
    prices: [
      { lookupKey: lookupKey(p.id, "month"), amount: p.monthCents, interval: "month" as const },
      { lookupKey: lookupKey(p.id, "year"), amount: p.yearCents, interval: "year" as const },
    ],
  })),
  ...PACKS.map((p) => ({
    takelyId: `pack:${p.id}`,
    name: `Takely — ${p.credits} crédits`,
    description: `Recharge ponctuelle de ${p.credits} crédits. Les crédits n'expirent pas.`,
    plan: false,
    prices: [{ lookupKey: p.lookupKey, amount: p.priceCents, interval: null }],
  })),
];

export const ALL_LOOKUP_KEYS = PRODUCTS.flatMap((p) => p.prices.map((x) => x.lookupKey));

export async function ensureCatalog(stripe: Stripe, appUrl: string, log: (m: string) => void = () => {}) {
  const products: Stripe.Product[] = [];
  for await (const p of stripe.products.list({ limit: 100 })) products.push(p);

  const planProducts: { product: string; prices: string[] }[] = [];
  for (const def of PRODUCTS) {
    let product = products.find((p) => p.metadata?.takely_id === def.takelyId);
    if (!product) {
      product = await stripe.products.create(
        { name: def.name, description: def.description, metadata: { takely_id: def.takelyId } },
        { idempotencyKey: `takely-product-${def.takelyId}` },
      );
      log(`+ product ${def.name}`);
    } else if (!product.active || product.name !== def.name || product.description !== def.description) {
      product = await stripe.products.update(product.id, { active: true, name: def.name, description: def.description });
    }

    const priceIds: string[] = [];
    for (const it of def.prices) {
      const [current] = (await stripe.prices.list({ lookup_keys: [it.lookupKey], limit: 1 })).data;
      const ok =
        current?.active &&
        current.product === product.id &&
        current.unit_amount === it.amount &&
        current.currency === CURRENCY &&
        (current.recurring?.interval ?? null) === it.interval;
      let price = current;
      if (!ok) {
        price = await stripe.prices.create({
          product: product.id,
          currency: CURRENCY,
          unit_amount: it.amount,
          tax_behavior: "inclusive",
          lookup_key: it.lookupKey,
          transfer_lookup_key: true,
          ...(it.interval ? { recurring: { interval: it.interval } } : {}),
        });
        if (current?.active && current.id !== price.id) await stripe.prices.update(current.id, { active: false });
        log(`+ price ${it.lookupKey}`);
      }
      priceIds.push(price!.id);
    }
    if (def.plan) planProducts.push({ product: product.id, prices: priceIds });
  }

  const portal: Stripe.BillingPortal.ConfigurationCreateParams = {
    business_profile: { headline: "Gérez votre abonnement Takely" },
    default_return_url: `${appUrl}/app/billing`,
    metadata: { takely: "true" },
    features: {
      customer_update: { enabled: true, allowed_updates: ["email", "address", "tax_id"] },
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
      subscription_cancel: {
        enabled: true,
        mode: "at_period_end",
        cancellation_reason: { enabled: true, options: ["too_expensive", "unused", "missing_features", "switched_service", "other"] },
      },
      subscription_update: {
        enabled: true,
        default_allowed_updates: ["price"],
        products: planProducts,
        proration_behavior: "none", // new plan (and its credits) from the next renewal
      },
    },
  };
  const configs = await stripe.billingPortal.configurations.list({ limit: 100 });
  const existing = configs.data.find((c) => c.metadata?.takely === "true");
  const config = existing
    ? await stripe.billingPortal.configurations.update(existing.id, portal)
    : await stripe.billingPortal.configurations.create(portal);
  log(`= portal configuration ${config.id}`);
  return { portalConfigurationId: config.id };
}

/**
 * Makes sure Stripe sends events to `${appUrl}/api/webhooks/stripe`. A signing secret
 * is only returned at creation, so when we don't hold it any more the endpoint is recreated.
 * Returns the new secret when one was created, otherwise null.
 */
export async function ensureWebhook(stripe: Stripe, appUrl: string, haveSecret: boolean): Promise<string | null> {
  const url = `${appUrl}/api/webhooks/stripe`;
  const list = await stripe.webhookEndpoints.list({ limit: 100 });
  const mine = list.data.filter((w) => w.metadata?.takely === "true");
  const match = mine.find((w) => w.url === url && w.status === "enabled");
  if (match && haveSecret) {
    const missing = WEBHOOK_EVENTS.filter((e) => !match.enabled_events.includes(e));
    if (missing.length) await stripe.webhookEndpoints.update(match.id, { enabled_events: WEBHOOK_EVENTS });
    return null;
  }
  for (const w of mine) if (w.url === url) await stripe.webhookEndpoints.del(w.id);
  const created = await stripe.webhookEndpoints.create({
    url,
    enabled_events: WEBHOOK_EVENTS,
    description: "Takely — crédits et abonnements",
    metadata: { takely: "true" },
  });
  return created.secret ?? null;
}
