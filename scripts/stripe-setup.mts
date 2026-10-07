/**
 * Creates (or updates) Takely's Stripe catalogue and customer-portal settings.
 * Safe to run several times: existing products and prices are reused.
 *
 *   STRIPE_SECRET_KEY=sk_test_… npm run stripe:setup
 *
 * Run it once in test mode, then once with the live key before launch. It needs
 * write access to Products, Prices and Customer portal (a secret key, or a
 * restricted key with those permissions, used only for this script).
 */
import Stripe from "stripe";
import { CURRENCY, PACKS, PLANS } from "../src/lib/billing.ts";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("Set STRIPE_SECRET_KEY first.");
  process.exit(1);
}
const stripe = new Stripe(key);
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");

type Item = { takelyId: string; name: string; description: string; lookupKey: string; amount: number; recurring: boolean };
const items: Item[] = [
  ...PLANS.map((p) => ({
    takelyId: `plan:${p.id}`,
    name: `Takely ${p.name}`,
    description: `${p.monthlyCredits} crédits par mois pour créer des pubs, vidéos et images IA.`,
    lookupKey: p.lookupKey,
    amount: p.priceCents,
    recurring: true,
  })),
  ...PACKS.map((p) => ({
    takelyId: `pack:${p.id}`,
    name: `Takely — ${p.credits} crédits`,
    description: `Recharge ponctuelle de ${p.credits} crédits. Les crédits n'expirent pas.`,
    lookupKey: p.lookupKey,
    amount: p.priceCents,
    recurring: false,
  })),
];

const existingProducts: Stripe.Product[] = [];
for await (const p of stripe.products.list({ limit: 100 })) existingProducts.push(p);

const planProducts: { product: string; prices: string[] }[] = [];

for (const it of items) {
  let product = existingProducts.find((p) => p.metadata?.takely_id === it.takelyId);
  if (!product) {
    product = await stripe.products.create({ name: it.name, description: it.description, metadata: { takely_id: it.takelyId } });
    console.log(`+ product ${it.name}`);
  } else if (!product.active || product.name !== it.name) {
    product = await stripe.products.update(product.id, { active: true, name: it.name, description: it.description });
  }

  const [current] = (await stripe.prices.list({ lookup_keys: [it.lookupKey], limit: 1 })).data;
  const matches =
    current &&
    current.active &&
    current.product === product.id &&
    current.unit_amount === it.amount &&
    current.currency === CURRENCY &&
    !!current.recurring === it.recurring;

  let price = current;
  if (!matches) {
    price = await stripe.prices.create({
      product: product.id,
      currency: CURRENCY,
      unit_amount: it.amount,
      tax_behavior: "inclusive",
      lookup_key: it.lookupKey,
      transfer_lookup_key: true, // moves the key from an older price if the amount changed
      ...(it.recurring ? { recurring: { interval: "month" } } : {}),
    });
    if (current?.active && current.id !== price.id) await stripe.prices.update(current.id, { active: false });
    console.log(`+ price ${it.lookupKey} = ${(it.amount / 100).toFixed(2)} ${CURRENCY.toUpperCase()}`);
  } else {
    console.log(`= price ${it.lookupKey} unchanged`);
  }
  if (it.recurring) planProducts.push({ product: product.id, prices: [price!.id] });
}

/* Customer portal: card, invoices, cancel at period end, switch between plans. */
const portalParams: Stripe.BillingPortal.ConfigurationCreateParams = {
  business_profile: { headline: "Gérez votre abonnement Takely" },
  default_return_url: `${APP_URL}/app/billing`,
  metadata: { takely: "true" },
  features: {
    customer_update: { enabled: true, allowed_updates: ["email", "address", "tax_id"] },
    invoice_history: { enabled: true },
    payment_method_update: { enabled: true },
    subscription_cancel: { enabled: true, mode: "at_period_end", cancellation_reason: { enabled: true, options: ["too_expensive", "unused", "missing_features", "switched_service", "other"] } },
    subscription_update: {
      enabled: true,
      default_allowed_updates: ["price"],
      products: planProducts,
      // The new plan starts at the next renewal; its credits arrive with that invoice.
      proration_behavior: "none",
    },
  },
};
const configs = await stripe.billingPortal.configurations.list({ limit: 100 });
const existing = configs.data.find((c) => c.metadata?.takely === "true");
if (existing) {
  await stripe.billingPortal.configurations.update(existing.id, portalParams);
  console.log(`= portal configuration ${existing.id} updated`);
} else {
  const c = await stripe.billingPortal.configurations.create(portalParams);
  console.log(`+ portal configuration ${c.id}`);
}

console.log("\nStripe catalogue ready.");
