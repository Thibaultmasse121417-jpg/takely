"use client";
import { useState } from "react";
import Link from "next/link";
import { CREDITS_PER, FREE_CREDITS, PLANS, formatPrice, type Interval } from "@/lib/billing";
import type { Dict } from "@/lib/i18n";
import { BuyButton } from "@/components/BuyButton";

const fill = (s: string, vars: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));

/**
 * Plan cards with a monthly / yearly switch. On the public site the buttons lead to
 * sign-up; inside the app they start Stripe Checkout (or open the portal when subscribed).
 */
export function PricingPlans({
  t,
  locale,
  mode,
  currentPlan = null,
  subscribed = false,
}: {
  t: Dict["plans"];
  locale: string;
  mode: "public" | "app";
  currentPlan?: string | null;
  subscribed?: boolean;
}) {
  const [interval, setInterval] = useState<Interval>("year");
  const approx = (credits: number) => {
    const clips = Math.floor(credits / CREDITS_PER.clip5s);
    const ads30 = Math.floor(credits / CREDITS_PER.ad30s);
    return ads30 > 0 ? fill(t.approx, { clips, ads: ads30 }) : fill(t.approxSmall, { clips, ads: Math.floor(credits / CREDITS_PER.ad15s) });
  };

  return (
    <div className="flex flex-col gap-8">
      <div role="radiogroup" aria-label="Billing" className="mx-auto flex items-center gap-1 rounded-full border border-line p-1">
        {(["month", "year"] as const).map((iv) => (
          <button
            key={iv}
            type="button"
            role="radio"
            aria-checked={interval === iv}
            onClick={() => setInterval(iv)}
            className={`flex h-10 items-center gap-2 rounded-full px-5 text-sm transition-colors ${interval === iv ? "bg-text text-ink" : "text-muted hover:text-text"}`}
          >
            {iv === "month" ? t.monthly : t.yearly}
            {iv === "year" && <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${interval === iv ? "bg-accent text-ink" : "bg-accent/15 text-accent"}`}>{t.save}</span>}
          </button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {/* Free */}
        <article className="flex flex-col gap-5 rounded-3xl border border-line-soft bg-[#111113] p-6">
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-semibold">{t.free}</h3>
            <p className="text-[40px] font-semibold leading-none tracking-[-0.04em]">{t.freePrice}</p>
            <p className="h-5 text-[13px] text-faint" />
          </div>
          <div className="flex flex-col gap-1 border-y border-line-soft py-4">
            <span className="font-mono text-sm">{FREE_CREDITS} {t.freeCredits}</span>
            <span className="text-[13px] text-faint">{approx(FREE_CREDITS)}</span>
          </div>
          <ul className="flex flex-1 flex-col gap-2.5 text-[14px] text-muted">
            {t.features.free.map((f) => <Feature key={f} text={f} />)}
          </ul>
          {mode === "public" ? (
            <Link href="/app" className="btn-ghost">{t.freeCta}</Link>
          ) : !subscribed ? (
            <span className="rounded-full border border-line py-2.5 text-center text-sm text-muted">{t.current}</span>
          ) : null}
        </article>

        {PLANS.map((p) => {
          const monthly = interval === "year" ? p.yearCents / 12 : p.monthCents;
          const isCurrent = subscribed && currentPlan === p.id;
          return (
            <article
              key={p.id}
              className={`relative flex flex-col gap-5 rounded-3xl border p-6 ${p.popular ? "border-accent/70 bg-[#13150f]" : "border-line-soft bg-[#111113]"}`}
            >
              {p.popular && (
                <span className="absolute right-5 top-5 rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold text-ink">{t.popular}</span>
              )}
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-semibold">{p.name}</h3>
                <p className="text-[40px] font-semibold leading-none tracking-[-0.04em]">
                  {formatPrice(monthly, locale)}
                  <span className="ml-1 text-base font-normal tracking-normal text-muted">{t.perMonth}</span>
                </p>
                <p className="h-5 text-[13px] text-faint">
                  {interval === "year" ? fill(t.billedYearly, { price: formatPrice(p.yearCents, locale) }) : t.billedMonthly}
                </p>
              </div>
              <div className="flex flex-col gap-1 border-y border-line-soft py-4">
                <span className="font-mono text-sm">
                  {interval === "year" ? `${(p.monthlyCredits * 12).toLocaleString(locale)} ${t.creditsYear}` : `${p.monthlyCredits} ${t.credits}`}
                </span>
                <span className="text-[13px] text-faint">{approx(p.monthlyCredits)} {t.perMonth}</span>
              </div>
              <ul className="flex flex-1 flex-col gap-2.5 text-[14px] text-muted">
                {t.features[p.id].map((f) => <Feature key={f} text={f} />)}
              </ul>
              {mode === "public" ? (
                <Link href="/app/billing" className={p.popular ? "btn-primary" : "btn-ghost"}>{fill(t.subscribe, { plan: p.name })}</Link>
              ) : isCurrent ? (
                <span className="rounded-full border border-accent py-2.5 text-center text-sm text-accent">{t.current}</span>
              ) : (
                <BuyButton
                  payload={{ plan: p.id, interval }}
                  label={subscribed ? t.manage : fill(t.subscribe, { plan: p.name })}
                  primary={p.popular}
                />
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <li className="flex gap-2.5">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0" aria-hidden="true"><path d="M5 12l5 5 9-10" /></svg>
      <span>{text}</span>
    </li>
  );
}
