import { getServerDict } from "@/lib/locale";
import { requireUser } from "@/lib/supabase/server";
import { PACKS, formatPrice } from "@/lib/billing";
import { BuyButton } from "./BuyButton";

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ success?: string }> }) {
  const { success } = await searchParams;
  const { sb, user } = await requireUser();
  const { locale, t } = await getServerDict();
  const { data: profile } = await sb.from("profiles").select("credits").eq("id", user!.id).maybeSingle();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10 px-5 py-12 sm:px-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-[-0.035em]">{t.billing.title}</h1>
        <p className="text-muted">
          {t.billing.balance} : <span className="font-mono text-text">{profile?.credits ?? 0}</span> {t.pricing.credits}
        </p>
        {success && <p role="status" className="text-sm text-accent">{t.billing.success}</p>}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {PACKS.map((p) => (
          <div key={p.id} className={`flex flex-col gap-4 rounded-2xl border p-7 ${p.popular ? "border-accent bg-[#141510]" : "border-line-soft"}`}>
            <span className={`text-[15px] ${p.popular ? "text-accent" : "text-muted"}`}>{p.name}</span>
            <span className="text-4xl font-semibold tracking-[-0.03em]">{formatPrice(p.priceCents, locale)}</span>
            <span className="text-[15px] text-muted">{p.credits} {t.pricing.credits}</span>
            <BuyButton pack={p.id} label={t.pricing.buy} primary={p.popular} />
          </div>
        ))}
      </div>
      <p className="text-sm text-faint">{t.pricing.note}</p>
    </div>
  );
}
