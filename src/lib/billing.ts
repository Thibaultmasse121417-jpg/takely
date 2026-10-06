/**
 * Monthly plans give recurring revenue and a credit allowance each month.
 * Packs are one-off top-ups for anyone (subscriber or not).
 * Rule of thumb: 1 credit ≈ €0.075–0.10 for the buyer; a 30 s ad ≈ 95 credits.
 */
export const PLANS = [
  { id: "starter", name: "Starter", monthlyCredits: 200, priceCents: 1900, popular: false },
  { id: "pro", name: "Pro", monthlyCredits: 600, priceCents: 4900, popular: true },
  { id: "agency", name: "Agency", monthlyCredits: 2000, priceCents: 14900, popular: false },
] as const;
export type PlanId = (typeof PLANS)[number]["id"];

export const PACKS = [
  { id: "pack-100", name: "100", credits: 100, priceCents: 1000 },
  { id: "pack-300", name: "300", credits: 300, priceCents: 2700 },
  { id: "pack-1000", name: "1000", credits: 1000, priceCents: 8500 },
] as const;
export type PackId = (typeof PACKS)[number]["id"];

export const CURRENCY = (process.env.NEXT_PUBLIC_CURRENCY || "eur").toLowerCase();

export function formatPrice(cents: number, locale = "fr") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: CURRENCY.toUpperCase(),
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}
