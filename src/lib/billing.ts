/**
 * Takely's offer. Structure: a free tier, three monthly plans (also sold yearly at -20 %)
 * and one-off credit packs. One Stripe Product per plan and per pack; each plan has a
 * monthly and a yearly Price, found by lookup key (`npm run stripe:setup` or the app's
 * first checkout creates them). Prices are VAT-inclusive.
 *
 * Unit economics: 1 credit ≈ €0.065–0.08 for the buyer. A 5 s video ≈ 14 credits
 * (fal cost ≈ €0.30), a 30 s ad ≈ 95 credits (≈ €2.20) → ≈ 60–70 % gross margin.
 */
export type Interval = "month" | "year";

export const FREE_CREDITS = 60; // enough for one 15 s ad with voice and music

export const PLANS = [
  {
    id: "standard",
    name: "Standard",
    monthlyCredits: 250,
    monthCents: 1900,
    yearCents: 18000, // 15 € / month billed yearly
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    monthlyCredits: 700,
    monthCents: 4900,
    yearCents: 46800, // 39 € / month
    popular: true,
  },
  {
    id: "max",
    name: "Max",
    monthlyCredits: 2000,
    monthCents: 12900,
    yearCents: 123600, // 103 € / month
    popular: false,
  },
] as const;
export type PlanId = (typeof PLANS)[number]["id"];
export type Plan = (typeof PLANS)[number];

export const lookupKey = (planId: string, interval: Interval) => `takely_${planId}_${interval === "year" ? "yearly" : "monthly"}`;

/** Plan and billing interval behind a Stripe price lookup key. */
export function planByLookupKey(key: string | null | undefined): { plan: Plan; interval: Interval } | undefined {
  for (const plan of PLANS) {
    if (key === lookupKey(plan.id, "month")) return { plan, interval: "month" };
    if (key === lookupKey(plan.id, "year")) return { plan, interval: "year" };
  }
  return undefined;
}

/** Plan features, shown on the pricing cards (all plans include everything above them). */
export const PLAN_LIMITS: Record<PlanId | "free", { parallelAds: number; parallelGens: number; watermark: boolean }> = {
  free: { parallelAds: 1, parallelGens: 2, watermark: true },
  standard: { parallelAds: 3, parallelGens: 6, watermark: false },
  pro: { parallelAds: 5, parallelGens: 10, watermark: false },
  max: { parallelAds: 10, parallelGens: 20, watermark: false },
};

export const PACKS = [
  { id: "pack-100", name: "100", credits: 100, priceCents: 1000, lookupKey: "takely_pack_100" },
  { id: "pack-300", name: "300", credits: 300, priceCents: 2700, lookupKey: "takely_pack_300" },
  { id: "pack-1000", name: "1000", credits: 1000, priceCents: 8500, lookupKey: "takely_pack_1000" },
] as const;
export type PackId = (typeof PACKS)[number]["id"];
export const packByLookupKey = (key: string | null | undefined) => PACKS.find((p) => p.lookupKey === key);

/** Rough output per month, for the pricing cards. */
export const CREDITS_PER = { clip5s: 14, ad15s: 52, ad30s: 95, image: 2 };

export const CURRENCY = (process.env.NEXT_PUBLIC_CURRENCY || "eur").toLowerCase();

export function formatPrice(cents: number, locale = "fr") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: CURRENCY.toUpperCase(),
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}
