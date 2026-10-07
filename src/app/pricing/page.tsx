import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PricingPlans } from "@/components/PricingPlans";
import { FREE_CREDITS, PACKS, PLANS, PLAN_LIMITS, formatPrice } from "@/lib/billing";
import { AD_LANGUAGES } from "@/lib/i18n";
import { getServerDict } from "@/lib/locale";

export const metadata: Metadata = { title: "Takely — Tarifs" };

export default async function PricingPage() {
  const { locale, t } = await getServerDict();
  const p = t.plans;
  const tb = p.table;
  const cols = [
    { name: p.free, credits: `${FREE_CREDITS} (${tb.once})`, limits: PLAN_LIMITS.free, commercial: false },
    ...PLANS.map((pl) => ({ name: pl.name, credits: `${pl.monthlyCredits} ${p.perMonth}`, limits: PLAN_LIMITS[pl.id], commercial: true })),
  ];
  const rows: [string, (c: (typeof cols)[number]) => string][] = [
    [tb.credits, (c) => c.credits],
    [tb.watermark, (c) => (c.limits.watermark ? tb.yes : tb.no)],
    [tb.parallelAds, (c) => String(c.limits.parallelAds)],
    [tb.parallelGens, (c) => String(c.limits.parallelGens)],
    [tb.languages, () => String(AD_LANGUAGES.length)],
    [tb.formats, () => "9:16 · 4:5 · 1:1 · 16:9"],
    [tb.commercial, (c) => (c.commercial ? tb.yes : tb.no)],
  ];

  return (
    <div className="min-h-screen">
      <SiteHeader t={t} locale={locale} />

      <section className="px-5 pb-10 pt-16 sm:px-8 sm:pt-24">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-5 text-center">
          <h1 className="display">{p.title}</h1>
          <p className="mx-auto max-w-2xl text-lg text-muted">{p.sub}</p>
        </div>
      </section>

      <section className="px-5 pb-20 sm:px-8">
        <div className="mx-auto max-w-[1400px]">
          <PricingPlans t={p} locale={locale} mode="public" />
        </div>
      </section>

      <section className="border-t border-line-soft px-5 py-20 sm:px-8">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-8">
          <h2 className="h2">{p.tableTitle}</h2>
          <div className="overflow-x-auto rounded-3xl border border-line-soft">
            <table className="w-full min-w-[720px] border-collapse text-left text-[14px]">
              <thead>
                <tr className="border-b border-line-soft">
                  <th scope="col" className="p-5" />
                  {cols.map((c) => (
                    <th key={c.name} scope="col" className="p-5 text-base font-semibold">{c.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(([label, get]) => (
                  <tr key={label} className="border-b border-line-soft last:border-0">
                    <th scope="row" className="p-5 font-normal text-muted">{label}</th>
                    {cols.map((c) => (
                      <td key={c.name} className="p-5 font-mono text-[13px] tabular-nums">{get(c)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="border-t border-line-soft px-5 py-20 sm:px-8">
        <div className="mx-auto grid max-w-[1400px] gap-12 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <h2 className="h2">{p.costTitle}</h2>
            <dl className="flex flex-col">
              {p.cost.map((c) => (
                <div key={c.t} className="flex items-baseline justify-between gap-6 border-b border-line-soft py-4">
                  <dt className="text-[15px]">{c.t}</dt>
                  <dd className="font-mono text-sm text-accent">{c.c}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="flex flex-col gap-6">
            <h2 className="h2">{p.topupsTitle}</h2>
            <p className="text-muted">{p.topupsSub}</p>
            <div className="flex flex-col gap-3">
              {PACKS.map((pk) => (
                <div key={pk.id} className="flex items-center justify-between gap-4 rounded-2xl border border-line-soft p-5">
                  <span className="font-medium">{pk.credits} {p.credits.split(" ")[0]}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-muted">{formatPrice(pk.priceCents, locale)}</span>
                    <Link href="/app/billing" className="btn-ghost">{p.buy}</Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-line-soft px-5 py-20 sm:px-8">
        <div className="mx-auto flex max-w-3xl flex-col gap-8">
          <h2 className="h2">{p.faqTitle}</h2>
          <div className="flex flex-col">
            {p.faq.map((f) => (
              <details key={f.q} className="group border-b border-line-soft py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-lg font-medium">
                  {f.q}
                  <span aria-hidden="true" className="text-2xl font-light text-muted transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="pt-3 text-[15px] leading-relaxed text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter t={t} locale={locale} />
    </div>
  );
}
