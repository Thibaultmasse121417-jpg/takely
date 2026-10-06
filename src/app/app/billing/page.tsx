import { getServerDict } from "@/lib/locale";
import { requireUser } from "@/lib/supabase/server";
import { PACKS, PLANS, formatPrice } from "@/lib/billing";
import { BuyButton } from "./BuyButton";

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ success?: string }> }) {
  const { success } = await searchParams;
  const { sb, user } = await requireUser();
  const { locale, t } = await getServerDict();
  const { data: profile } = await sb
    .from("profiles")
    .select("credits, plan, plan_status, current_period_end")
    .eq("id", user!.id)
    .maybeSingle();
  const subscribed = profile?.plan_status === "active" || profile?.plan_status === "past_due";

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-12 px-5 py-12 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-[-0.035em]">{t.billing.title}</h1>
          <p className="text-muted">
            {t.billing.balance} : <span className="font-mono text-text">{profile?.credits ?? 0}</span> {t.pricing.credits}
          </p>
          {success && <p role="status" className="text-sm text-accent">{t.billing.success}</p>}
        </div>
        {subscribed && (
          <BuyButton endpoint="/api/portal" label={t.pricing.manage} primary={false} />
        )}
      </div>

      <section className="flex flex-col gap-4">
        <div className="grid gap-4 md:grid-cols-3">
          {PLANS.map((p) => {
            const current = subscribed && profile?.plan === p.id;
            return (
              <div key={p.id} className={`flex flex-col gap-4 rounded-2xl border p-7 ${p.popular ? "border-accent bg-[#141510]" : "border-line-soft"}`}>
                <span className={`text-[15px] ${p.popular ? "text-accent" : "text-muted"}`}>
                  {p.name}
                  {p.popular ? ` · ${t.pricing.popular}` : ""}
                </span>
                <span className="text-4xl font-semibold tracking-[-0.03em]">
                  {formatPrice(p.priceCents, locale)}
                  <span className="text-base font-normal text-muted"> {t.pricing.perMonth}</span>
                </span>
                <span className="text-[15px] text-muted">{p.monthlyCredits} {t.pricing.monthly}</span>
                {current ? (
                  <span className="mt-2 rounded-full border border-accent py-3 text-center text-sm text-accent">{t.pricing.current}</span>
                ) : (
                  <BuyButton payload={{ plan: p.id }} label={subscribed ? t.pricing.manage : t.pricing.subscribe} primary={p.popular} />
                )}
              </div>
            );
          })}
        </div>
        <p className="text-sm text-faint">{t.pricing.cancel} {t.pricing.note}</p>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold tracking-[-0.02em]">{t.pricing.topups}</h2>
          <p className="text-sm text-muted">{t.pricing.topupsSub}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {PACKS.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-4 rounded-2xl border border-line-soft p-5">
              <div className="flex flex-col">
                <span className="font-medium">{p.credits} {t.pricing.credits}</span>
                <span className="text-sm text-muted">{formatPrice(p.priceCents, locale)}</span>
              </div>
              <BuyButton payload={{ pack: p.id }} label={t.pricing.buy} primary={false} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
