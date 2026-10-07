import { getServerDict } from "@/lib/locale";
import { requireUser } from "@/lib/supabase/server";
import { PACKS, formatPrice } from "@/lib/billing";
import { BuyButton } from "@/components/BuyButton";
import { PricingPlans } from "@/components/PricingPlans";

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ success?: string }> }) {
  const { success } = await searchParams;
  const { sb, user } = await requireUser();
  const { locale, t } = await getServerDict();
  const { data: profile } = await sb
    .from("profiles")
    .select("credits, plan, plan_status")
    .eq("id", user!.id)
    .maybeSingle();
  const subscribed = ["active", "past_due", "trialing"].includes(profile?.plan_status ?? "");

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-12 px-5 py-12 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-[-0.035em]">{t.billing.title}</h1>
          <p className="text-muted">
            {t.billing.balance} : <span className="font-mono text-text">{profile?.credits ?? 0}</span> {t.pricing.credits}
          </p>
          {success && <p role="status" className="text-sm text-accent">{t.billing.success}</p>}
          {profile?.plan_status === "past_due" && <p role="alert" className="text-sm text-danger">{t.billing.pastDue}</p>}
        </div>
        {subscribed && (
          <div className="w-56"><BuyButton endpoint="/api/portal" label={t.plans.manage} primary={false} /></div>
        )}
      </div>

      <PricingPlans t={t.plans} locale={locale} mode="app" currentPlan={profile?.plan ?? null} subscribed={subscribed} />

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold tracking-[-0.02em]">{t.plans.topupsTitle}</h2>
          <p className="text-sm text-muted">{t.plans.topupsSub}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {PACKS.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-4 rounded-2xl border border-line-soft p-5">
              <div className="flex flex-col">
                <span className="font-medium">{p.credits} {t.pricing.credits}</span>
                <span className="text-sm text-muted">{formatPrice(p.priceCents, locale)}</span>
              </div>
              <div className="w-28"><BuyButton payload={{ pack: p.id }} label={t.plans.buy} primary={false} /></div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
