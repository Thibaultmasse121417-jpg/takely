/**
 * Takely's Stripe catalogue. One Stripe Product per plan and per pack (so invoices,
 * Checkout and the customer portal show distinct names), each with one Price found
 * by its lookup key. `npm run stripe:setup` creates them all; the app never hardcodes
 * price ids.
 *
 * Rule of thumb: 1 credit ≈ €0.075–0.10 for the buyer; a 30 s ad ≈ 95 credits.
 * Prices are VAT-inclusive (tax_behavior "inclusive").
 */
export const PLANS = [
  { id: "starter", name: "Starter", monthlyCredits: 200, priceCents: 1900, popular: false, lookupKey: "takely_starter_monthly" },
  { id: "pro", name: "Pro", monthlyCredits: 600, priceCents: 4900, popular: true, lookupKey: "takely_pro_monthly" },
  { id: "agency", name: "Agency", monthlyCredits: 2000, priceCents: 14900, popular: false, lookupKey: "takely_agency_monthly" },
] as const;
export type PlanId = (typeof PLANS)[number]["id"];

export const PACKS = [
  { id: "pack-100", name: "100", credits: 100, priceCents: 1000, lookupKey: "takely_pack_100" },
  { id: "pack-300", name: "300", credits: 300, priceCents: 2700, lookupKey: "takely_pack_300" },
  { id: "pack-1000", name: "1000", credits: 1000, priceCents: 8500, lookupKey: "takely_pack_1000" },
] as const;
export type PackId = (typeof PACKS)[number]["id"];

export const planByLookupKey = (key: string | null | undefined) => PLANS.find((p) => p.lookupKey === key);
export const packByLookupKey = (key: string | null | undefined) => PACKS.find((p) => p.lookupKey === key);

export const CURRENCY = (process.env.NEXT_PUBLIC_CURRENCY || "eur").toLowerCase();

export function formatPrice(cents: number, locale = "fr") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: CURRENCY.toUpperCase(),
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}
