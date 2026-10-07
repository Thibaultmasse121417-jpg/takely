/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PricingPlans } from "@/components/PricingPlans";
import { getServerDict } from "@/lib/locale";
import { AD_LANGUAGES } from "@/lib/i18n";
import { SHOWCASE as S } from "@/lib/showcase";

const MODELS = ["Kling", "Veo", "Seedance", "FLUX", "ElevenLabs", "Claude"];
const PRODUCT_LINKS = ["/app", "/app?mode=video", "/app?mode=image"];
const PRODUCT_IMAGES = [S.sneaker, S.headphones, S.serum];
const UPDATE_IMAGES = [S.headphones, S.interior, S.mug];
const HERO_VIDEO = process.env.NEXT_PUBLIC_HERO_VIDEO_URL;

const wrap = "mx-auto w-full max-w-[1280px] px-4 sm:px-8";

export default async function Home() {
  const { locale, t } = await getServerDict();
  const h = t.home;
  const faq = t.plans.faq;
  const ex = h.examples;

  return (
    <div className="min-h-screen">
      <SiteHeader t={t} locale={locale} />

      <main>
        {/* Hero */}
        <section className={`${wrap} pt-12 text-center sm:pt-24`}>
          <span className="label-mono">{h.eyebrow}</span>
          <h1 className="mx-auto mt-5 max-w-[15ch] text-[clamp(40px,7.2vw,96px)] font-medium leading-none tracking-[-0.035em] [text-wrap:balance]">{h.title}</h1>
          <p className="mx-auto mt-6 max-w-[56ch] text-[17px] leading-relaxed text-muted sm:text-xl">{h.sub}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/app" className="inline-flex h-11 items-center rounded-full bg-text px-5 text-[15px] font-medium text-ink hover:opacity-90">{h.ctaPrimary}</Link>
            <Link href="/#exemples" className="inline-flex h-11 items-center rounded-full border border-line px-5 text-[15px] hover:border-text">{h.ctaSecondary}</Link>
          </div>
          <p className="mt-4 text-[13px] text-faint">{h.freeNote}</p>

          <div className="relative mt-12 aspect-[4/5] overflow-hidden rounded-[20px] bg-panel sm:mt-16 sm:aspect-[21/9]">
            {HERO_VIDEO ? (
              <video src={HERO_VIDEO} autoPlay muted loop playsInline className="h-full w-full object-cover" />
            ) : (
              <img src={S.perfume} alt="" className="drift h-full w-full object-cover" />
            )}
            <span className="absolute right-4 top-4 rounded-lg bg-ink/60 px-2.5 py-1.5 font-mono text-[11px] text-muted sm:right-5 sm:top-5">16:9 · 9:16 · 1:1 · 4:5</span>
            <div className="absolute bottom-4 left-4 flex max-w-[calc(100%-32px)] items-center gap-2.5 rounded-xl border border-white/10 bg-ink/70 px-3.5 py-2.5 text-left text-[12px] text-muted backdrop-blur-md sm:bottom-5 sm:left-5 sm:text-[13px]">
              <span className="pulse-dot h-2 w-2 shrink-0 rounded-full bg-[#ff4d4d]" />
              <span><b className="font-medium text-text">{h.heroBriefLabel}</b> {h.heroBrief}</span>
            </div>
          </div>
        </section>

        {/* Models */}
        <div className={wrap}>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 border-b border-line-soft py-11 text-muted">
            <span className="label-mono w-full text-center sm:w-auto">{h.models}</span>
            {MODELS.map((m) => <b key={m} className="text-[17px] font-medium tracking-[-0.01em]">{m}</b>)}
          </div>
        </div>

        {/* Products */}
        <section id="produits" className={`${wrap} scroll-mt-20 py-20 sm:py-32`}>
          <SectionHead title={h.productsTitle} sub={h.productsSub} />
          <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr_1fr]">
            {h.products.map((p, i) => (
              <article key={p.title} className="group flex min-w-0 flex-col overflow-hidden rounded-[14px] bg-panel">
                <div className="aspect-[4/3] overflow-hidden">
                  <img src={PRODUCT_IMAGES[i]} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
                </div>
                <div className="flex flex-1 flex-col gap-3 p-6">
                  {p.badge && <span className="self-start rounded-full border border-line px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.06em] text-muted">{p.badge}</span>}
                  <h3 className="text-2xl font-medium tracking-[-0.02em]">{p.title}</h3>
                  <p className="text-[15px] text-muted">{p.desc}</p>
                  <div className="flex flex-wrap gap-2.5">
                    <Link href={PRODUCT_LINKS[i]} className={`inline-flex h-9 items-center rounded-full px-4 text-sm font-medium ${i === 0 ? "bg-text text-ink hover:opacity-90" : "border border-line hover:border-text"}`}>{p.cta}</Link>
                    {i === 0 && <Link href="/#exemples" className="inline-flex h-9 items-center rounded-full border border-line px-4 text-sm hover:border-text">{h.examplesCta}</Link>}
                  </div>
                  <p className="mt-auto pt-2 text-[13px] text-faint">{p.meta}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Examples */}
        <section id="exemples" className={`${wrap} scroll-mt-20 pb-20 sm:pb-32`}>
          <SectionHead title={h.examplesTitle} sub={h.examplesSub} />
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <Shot src={S.coffee} label={ex[0]} format="9:16" className="aspect-[9/16] lg:row-span-2 lg:aspect-auto" />
            <Shot src={S.burger} label={ex[1]} format="4:5" className="aspect-[4/5]" />
            <Shot src={S.serum} label={ex[2]} format="4:5" className="aspect-[4/5]" />
            <Shot src={S.sneaker} label={ex[3]} format="9:16" className="aspect-[9/16] lg:row-span-2 lg:aspect-auto" />
            <Shot src={S.interior} label={ex[4]} format="16:9" className="col-span-2 aspect-video lg:aspect-auto" />
          </div>
          <p className="mt-3.5 text-[12px] text-faint">{h.examplesNote}</p>
        </section>

        {/* Steps */}
        <section className={`${wrap} pb-20 sm:pb-32`}>
          <SectionHead title={h.stepsTitle} />
          <ol className="grid gap-4 md:grid-cols-3">
            {h.steps.map((s, i) => (
              <li key={s.t} className="flex min-w-0 flex-col gap-2.5 border-t border-line-soft pt-6">
                <span className="font-mono text-[13px] text-faint">{h.stepLabel} {i + 1}</span>
                <h3 className="text-[22px] font-medium tracking-[-0.02em]">{s.t}</h3>
                <p className="text-[15px] text-muted">{s.d}</p>
                <span className="font-mono text-[12px] text-faint">{s.time}</span>
              </li>
            ))}
          </ol>
          <div className="mt-12 grid grid-cols-[auto_1fr] items-center gap-5 rounded-[14px] bg-panel p-5 sm:p-8 md:grid-cols-[auto_1fr_auto]">
            <img src={S.mug} alt="" className="h-[72px] w-[72px] rounded-xl object-cover" />
            <div className="min-w-0">
              <small className="mb-1 block text-[12px] text-faint">{h.briefLabel}</small>
              <div className="text-base sm:text-xl">{h.briefText}</div>
            </div>
            <div className="col-span-2 flex flex-wrap gap-2 md:col-span-1 md:justify-end">
              {h.briefPills.map((p) => <span key={p} className="rounded-full border border-line px-2.5 py-1.5 font-mono text-[12px] text-muted">{p}</span>)}
            </div>
          </div>
        </section>

        {/* Stats + languages */}
        <section className={`${wrap} pb-20 sm:pb-32`}>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[14px] border border-line-soft bg-line-soft lg:grid-cols-4">
            {h.stats.map((s) => (
              <div key={s.l} className="flex min-w-0 flex-col gap-2 bg-ink p-6 sm:p-7">
                <b className="text-[28px] font-medium tracking-[-0.03em] sm:text-[34px]">{s.v}</b>
                <span className="text-sm text-muted">{s.l}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {AD_LANGUAGES.map((l) => <span key={l.code} className="chip" data-on={l.code === locale}>{l.name}</span>)}
          </div>
        </section>

        {/* Trust */}
        <section className={`${wrap} pb-20 sm:pb-32`}>
          <SectionHead title={h.trustTitle} sub={h.trustSub} />
          <div className="grid gap-4 md:grid-cols-2">
            {h.trust.map((x, i) => (
              <div key={x.t} className="grid min-w-0 grid-cols-[40px_1fr] items-start gap-4 rounded-[14px] bg-panel p-7">
                <TrustIcon i={i} />
                <div>
                  <h3 className="mb-1.5 text-lg font-medium">{x.t}</h3>
                  <p className="text-[15px] text-muted">{x.d}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section id="tarifs" className={`${wrap} scroll-mt-20 pb-20 sm:pb-32`}>
          <SectionHead title={h.pricingTitle} />
          <PricingPlans t={t.plans} locale={locale} mode="public" />
          <div className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[13px] text-faint">
            {h.payNotes.map((n) => <span key={n}>{n}</span>)}
          </div>
          <div className="mt-6 text-center">
            <Link href="/pricing" className="text-sm text-muted hover:text-text">{h.compare} →</Link>
          </div>
        </section>

        {/* Updates */}
        <section className={`${wrap} pb-20 sm:pb-32`}>
          <SectionHead title={h.updatesTitle} />
          <div className="grid gap-4 md:grid-cols-3">
            {h.updates.map((u, i) => (
              <div key={u.t} className="group flex min-w-0 flex-col gap-3.5">
                <div className="aspect-[16/10] overflow-hidden rounded-[14px] bg-panel">
                  <img src={UPDATE_IMAGES[i]} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
                </div>
                <small className="font-mono text-[12px] text-faint">{u.tag}</small>
                <h3 className="text-[19px] font-medium tracking-[-0.02em]">{u.t}</h3>
                <p className="text-sm text-muted">{u.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className={`${wrap} scroll-mt-20 pb-20 sm:pb-32`}>
          <SectionHead title={t.plans.faqTitle} />
          <div className="max-w-[860px]">
            {faq.map((f, i) => (
              <details key={f.q} open={i === 0} className="group border-t border-line-soft py-5 last:border-b">
                <summary className="flex cursor-pointer list-none justify-between gap-4 text-lg [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span className="text-xl leading-none text-faint group-open:hidden">+</span>
                  <span className="hidden text-xl leading-none text-faint group-open:inline">–</span>
                </summary>
                <p className="mt-3 max-w-[65ch] text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Final call to action */}
        <div className={`${wrap} pb-20 sm:pb-32`}>
          <div className="relative grid min-h-[440px] place-items-center overflow-hidden rounded-[20px] text-center">
            <img src={S.interior} alt="" className="absolute inset-0 h-full w-full object-cover brightness-[.45]" />
            <div className="relative flex flex-col items-center gap-5 px-5 py-12">
              <h2 className="max-w-[14ch] text-[clamp(36px,5.6vw,72px)] font-medium leading-none tracking-[-0.035em] [text-wrap:balance]">{h.finalTitle}</h2>
              <p className="text-muted">{h.finalSub}</p>
              <Link href="/app" className="inline-flex h-11 items-center rounded-full bg-text px-5 text-[15px] font-medium text-ink hover:opacity-90">{h.ctaPrimary}</Link>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter t={t} locale={locale} />
    </div>
  );
}

function SectionHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
      <h2 className="max-w-[18ch] text-[clamp(32px,4.4vw,56px)] font-medium leading-[1.05] tracking-[-0.03em] [text-wrap:balance]">{title}</h2>
      {sub && <p className="max-w-[44ch] text-muted">{sub}</p>}
    </div>
  );
}

function Shot({ src, label, format, className }: { src: string; label: string; format: string; className: string }) {
  return (
    <figure className={`relative m-0 overflow-hidden rounded-[14px] bg-panel ${className}`}>
      <img src={src} alt="" className="h-full w-full object-cover" />
      <figcaption className="absolute inset-x-3 bottom-3 flex justify-between gap-2 text-[12px]">
        <span className="rounded-lg bg-ink/65 px-2 py-1 backdrop-blur-md">{label}</span>
        <span className="rounded-lg bg-ink/65 px-2 py-1 font-mono text-muted backdrop-blur-md">{format}</span>
      </figcaption>
    </figure>
  );
}

function TrustIcon({ i }: { i: number }) {
  const paths = [
    "M4 12a8 8 0 1 0 2.3-5.7M4 4v4h4",
    "M6 10V7a6 6 0 0 1 12 0v3M5 10h14v10H5z",
    "M6 6l12 12M18 6L6 18",
    "M12 3v12m0 0l-4-4m4 4l4-4M5 19h14",
  ];
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 text-text" aria-hidden="true">
      <path d={paths[i]} />
    </svg>
  );
}
