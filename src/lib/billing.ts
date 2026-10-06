export const PACKS = [
  { id: "starter", name: "Starter", credits: 100, priceCents: 1200, popular: false },
  { id: "creator", name: "Creator", credits: 400, priceCents: 3900, popular: true },
  { id: "studio", name: "Studio", credits: 1200, priceCents: 9900, popular: false },
] as const;

export type PackId = (typeof PACKS)[number]["id"];

export const CURRENCY = (process.env.NEXT_PUBLIC_CURRENCY || "eur").toLowerCase();

export function formatPrice(cents: number, locale = "fr") {
  return new Intl.NumberFormat(locale, { style: "currency", currency: CURRENCY.toUpperCase(), maximumFractionDigits: 0 }).format(cents / 100);
}
