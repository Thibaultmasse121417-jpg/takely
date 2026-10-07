import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { HeroReel } from "@/components/HeroReel";
import { PricingPlans } from "@/components/PricingPlans";
import { getServerDict } from "@/lib/locale";
import { AD_LANGUAGES } from "@/lib/i18n";

const MODELS = ["Kling 3.0", "Veo 3.1", "Seedance", "FLUX", "Nano Banana", "ElevenLabs", "Claude"];
const CREATE_MODES = ["ad", "video", "image"] as const;

export default async function Home() {
  const { locale, t } = await getServerDict();
  const h = t.home;

  return (
    <div className="min-h-screen">
      <SiteHeader t={t} locale={locale} />

      {/* Hero */}
      <section className="px-5 pb-16 pt-16 sm:px-8 sm:pt-24">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-8">
          <span className="label-mono text-accent">{h.eyebrow}</span>
          <h1 className="display sm:whitespace-pre-line">{h.title}</h1>
          <div className="flex flex-wrap items-end justify-between gap-8">
            <p className="max-w-xl text-lg leading-relaxed text-muted">{h.sub}</p>
            <div className="flex flex-col items-start gap-3">
              <div className="flex flex-wrap gap-3">
                <Link href="/app" className="inline-flex h-12 items-center rounded-full bg-text px-6 text-[15px] font-medium text-ink hover:opacity-90">{h.ctaPrimary}</Link>
                <Link href="/pricing" className="inline-flex h-12 items-center rounded-full border border-line px-6 text-[15px] hover:border-faint">{h.ctaSecondary}</Link>
              </div>
              <span className="text-[13px] text-faint">{h.freeNote}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="px-3 sm:px-8">
        <HeroReel t={h} />
      </section>

      {/* Models */}
      <section className="px-5 py-14 sm:px-8">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center gap-6 text-center">
          <span className="label-mono">{h.models}</span>
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-3 text-lg font-medium tracking-[-0.01em] text-muted">
            {MODELS.map((m) => <span key={m}>{m}</span>)}
          </div>
        </div>
      </section>

      {/* Three ways to create */}
      <section id="create" className="scroll-mt-20 px-5 py-20 sm:px-8">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-10">
          <h2 className="h2">{h.createTitle}</h2>
          <div id="studio" className="grid scroll-mt-20 gap-4 lg:grid-cols-3">
            {h.create.map((c, i) => (
              <Link key={c.tag} href={CREATE_MODES[i] === "ad" ? "/app" : `/app?mode=${CREATE_MODES[i]}`} className="group flex flex-col gap-5 rounded-3xl border border-line-soft bg-[#111113] p-3 transition-colors hover:border-line">
                <div className="relative flex aspect-[4/3] items-end overflow-hidden rounded-2xl border border-line-soft p-4" style={{ background: ["#1b1a17", "#16191c", "#1b181d"][i] }}>
                  <div className="reel-scan absolute inset-0" aria-hidden="true" />
                  <CreateArt mode={CREATE_MODES[i]} />
                </div>
                <div className="flex flex-col gap-2 px-3 pb-4">
                  <span className="label-mono text-accent">{c.tag}</span>
                  <h3 className="text-2xl font-semibold tracking-[-0.02em]">{c.title}</h3>
                  <p className="text-[15px] text-muted">{c.desc}</p>
                  <span className="mt-2 text-sm text-text group-hover:text-accent">{c.cta} →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How an ad is made: a real 4-step sequence */}
      <section className="border-t border-line-soft px-5 py-20 sm:px-8">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-12">
          <h2 className="h2 max-w-3xl">{h.stepsTitle}</h2>
          <ol className="grid gap-px overflow-hidden rounded-3xl border border-line-soft bg-line-soft md:grid-cols-2 xl:grid-cols-4">
            {h.steps.map((s, i) => (
              <li key={s.t} className="flex flex-col gap-4 bg-ink p-7">
                <span className="font-mono text-sm text-accent">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="text-xl font-semibold">{s.t}</h3>
                <p className="text-[15px] leading-relaxed text-muted">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-line-soft px-5 py-20 sm:px-8">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-12">
          <h2 className="h2 max-w-3xl">{h.featuresTitle}</h2>
          <div className="grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {h.features.map((f) => (
              <div key={f.t} className="flex flex-col gap-2 border-t border-line pt-5">
                <h3 className="text-lg font-semibold">{f.t}</h3>
                <p className="text-[15px] leading-relaxed text-muted">{f.d}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {AD_LANGUAGES.map((l) => (
              <span key={l.code} className="chip" data-on={l.code === locale}>{l.name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* For whom */}
      <section id="for" className="scroll-mt-20 border-t border-line-soft px-5 py-20 sm:px-8">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-12">
          <h2 className="h2">{h.forTitle}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {h.for.map((f) => (
              <div key={f.t} className="flex min-h-[200px] flex-col justify-between gap-6 rounded-3xl border border-line-soft bg-[#111113] p-6">
                <h3 className="text-2xl font-semibold tracking-[-0.02em]">{f.t}</h3>
                <p className="text-[15px] text-muted">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t border-line-soft px-5 py-20 sm:px-8">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-10">
          <h2 className="h2 max-w-4xl">{h.pricingTitle}</h2>
          <PricingPlans t={t.plans} locale={locale} mode="public" />
          <Link href="/pricing" className="self-center text-sm text-muted hover:text-text">{h.compare} →</Link>
        </div>
      </section>

      {/* Final call to action */}
      <section className="px-3 pb-16 sm:px-8">
        <div className="mx-auto flex max-w-[1400px] flex-col items-start gap-8 rounded-[28px] bg-accent px-6 py-14 text-ink sm:px-12 sm:py-20">
          <h2 className="display max-w-5xl !text-[clamp(40px,6.4vw,96px)]">{h.finalTitle}</h2>
          <Link href="/app" className="inline-flex h-12 items-center rounded-full bg-ink px-6 text-[15px] font-medium text-text hover:opacity-90">{h.ctaPrimary}</Link>
        </div>
      </section>

      <SiteFooter t={t} locale={locale} />
    </div>
  );
}

/** Small, honest illustrations of each tool's interface (no fake results). */
function CreateArt({ mode }: { mode: (typeof CREATE_MODES)[number] }) {
  if (mode === "ad") {
    return (
      <div className="relative grid w-full grid-cols-4 gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex aspect-[9/16] flex-col justify-between rounded-lg border border-line bg-ink/60 p-1.5">
            <span className="font-mono text-[9px] text-faint">0:{String(i * 5).padStart(2, "0")}</span>
            <span className="h-1 w-full rounded-full bg-accent/70" style={{ opacity: i < 3 ? 1 : 0.25 }} />
          </div>
        ))}
      </div>
    );
  }
  if (mode === "video") {
    return (
      <div className="relative flex w-full flex-col gap-3">
        <div className="aspect-video w-full rounded-lg border border-line bg-ink/60" />
        <div className="flex items-center gap-2">
          <span className="h-1.5 flex-1 rounded-full bg-line"><span className="block h-1.5 w-2/3 rounded-full bg-accent" /></span>
          <span className="font-mono text-[10px] text-faint">0:05</span>
        </div>
      </div>
    );
  }
  return (
    <div className="relative grid w-full grid-cols-3 gap-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="aspect-square rounded-lg border border-line bg-ink/60" />
      ))}
    </div>
  );
}
