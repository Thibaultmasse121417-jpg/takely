import Link from "next/link";
import { Logo } from "@/components/Logo";
import { LangSwitch } from "@/components/LangSwitch";
import { getServerDict } from "@/lib/locale";
import { AD_LANGUAGES } from "@/lib/i18n";
import { PACKS, formatPrice } from "@/lib/billing";

const EXAMPLES = [
  { tag: "COFFEE", tone: "#1c1c1f" },
  { tag: "SKINCARE", tone: "#201f1c" },
  { tag: "SNEAKERS", tone: "#1a1d1f" },
  { tag: "FRAGRANCE", tone: "#1e1c20" },
  { tag: "HOME", tone: "#1c1f1c" },
];

export default async function Home() {
  const { locale, t } = await getServerDict();

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5 sm:px-8">
        <Logo />
        <nav aria-label="Main" className="hidden gap-7 text-sm text-muted md:flex">
          <a href="#how" className="hover:text-text">{t.nav.how}</a>
          <a href="#tools" className="hover:text-text">{t.nav.tools}</a>
          <a href="#pricing" className="hover:text-text">{t.nav.pricing}</a>
        </nav>
        <div className="flex items-center gap-2">
          <LangSwitch locale={locale} />
          <Link href="/login" className="hidden px-4 py-2.5 text-sm sm:inline-flex">{t.nav.login}</Link>
          <Link href="/app" className="inline-flex rounded-full bg-text px-5 py-2.5 text-sm font-medium text-ink hover:opacity-90">{t.nav.start}</Link>
        </div>
      </header>

      <section className="mx-auto flex max-w-7xl flex-col items-center gap-7 px-6 pb-16 pt-20 text-center sm:px-8 sm:pt-28">
        <div className="rounded-full border border-line px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-muted">{t.hero.badge}</div>
        <h1 className="max-w-5xl text-[clamp(42px,7vw,88px)] font-semibold leading-[1] tracking-[-0.045em]">
          {t.hero.title1}
          <br />
          {t.hero.title2}
        </h1>
        <p className="max-w-2xl text-lg text-muted">{t.hero.sub}</p>

        <Link href="/app" className="mt-3 flex w-full max-w-3xl flex-col gap-3.5 rounded-[20px] border border-line bg-panel p-4 text-left transition-colors hover:border-faint">
          <div className="flex items-start gap-3.5">
            <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-xl border border-[#333338] bg-[#222226] font-mono text-[10px] text-faint">PHOTO</div>
            <p className="pt-1 text-base text-[#e4e4e2]">{t.hero.demo}</p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2 text-[13px] text-muted">
              <span className="rounded-full border border-line px-3 py-1.5">30 s</span>
              <span className="rounded-full border border-line px-3 py-1.5">9:16</span>
              <span className="rounded-full border border-line px-3 py-1.5">{AD_LANGUAGES.find((l) => l.code === locale)?.name}</span>
            </div>
            <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-full bg-accent">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0c0c0d" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5" /><path d="M5 12l7-7 7 7" /></svg>
            </span>
          </div>
        </Link>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24 sm:px-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {EXAMPLES.map((e) => (
            <div key={e.tag} className="flex aspect-[9/16] flex-col justify-end rounded-2xl border border-line p-3.5" style={{ background: e.tone }}>
              <span className="label-mono">{e.tag} · 9:16</span>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="border-t border-line-soft px-6 py-24 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-12">
          <h2 className="max-w-2xl text-[clamp(32px,4vw,48px)] font-semibold tracking-[-0.035em]">{t.how.title}</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              [t.how.s1t, t.how.s1d],
              [t.how.s2t, t.how.s2d],
              [t.how.s3t, t.how.s3d],
            ].map(([title, desc], i) => (
              <div key={title} className="card flex flex-col gap-3 p-7">
                <span className="font-mono text-xs text-accent">0{i + 1}</span>
                <h3 className="text-xl font-semibold">{title}</h3>
                <p className="text-[15px] text-muted">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="tools" className="border-t border-line-soft px-6 py-24 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-12">
          <h2 className="text-[clamp(32px,4vw,48px)] font-semibold tracking-[-0.035em]">{t.tools.title}</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              [t.tools.ad, t.tools.adD, "ad"],
              [t.tools.video, t.tools.videoD, "video"],
              [t.tools.image, t.tools.imageD, "image"],
            ].map(([title, desc, mode]) => (
              <Link key={mode} href={`/app?mode=${mode}`} className="card flex flex-col gap-3 p-7 transition-colors hover:border-faint">
                <h3 className="text-xl font-semibold">{title}</h3>
                <p className="text-[15px] text-muted">{desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-line-soft px-6 py-24 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-12">
          <div className="flex flex-[1_1_380px] flex-col gap-4">
            <h2 className="whitespace-pre-line text-[clamp(32px,4vw,48px)] font-semibold tracking-[-0.035em]">{t.langs.title}</h2>
            <p className="max-w-md text-[17px] text-muted">{t.langs.sub}</p>
          </div>
          <div className="flex flex-[1_1_380px] flex-wrap gap-2">
            {AD_LANGUAGES.slice(0, 14).map((l) => (
              <span key={l.code} className="chip" data-on={l.code === locale}>{l.name}</span>
            ))}
            <span className="chip">+ {AD_LANGUAGES.length - 14}</span>
          </div>
        </div>
      </section>

      <section id="pricing" className="border-t border-line-soft px-6 py-24 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-12">
          <div className="flex flex-col gap-3">
            <h2 className="text-[clamp(32px,4vw,48px)] font-semibold tracking-[-0.035em]">{t.pricing.title}</h2>
            <p className="text-muted">{t.pricing.note}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {PACKS.map((p) => (
              <div key={p.id} className={`flex flex-col gap-4 rounded-2xl border p-7 ${p.popular ? "border-accent bg-[#141510]" : "border-line-soft"}`}>
                <span className={`text-[15px] ${p.popular ? "text-accent" : "text-muted"}`}>{p.name}{p.popular ? ` · ${t.pricing.popular}` : ""}</span>
                <span className="text-4xl font-semibold tracking-[-0.03em]">{formatPrice(p.priceCents, locale)}</span>
                <span className="text-[15px] text-muted">{p.credits} {t.pricing.credits}</span>
                <Link href="/app/billing" className={p.popular ? "btn-primary mt-2" : "btn-ghost mt-2"}>{t.pricing.buy}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-line-soft px-6 py-8 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-4 text-[13px] text-faint">
          <span>© {new Date().getFullYear()} takely</span>
          <div className="flex gap-5">
            <a href="#" className="hover:text-text">{t.footer.legal}</a>
            <a href="#" className="hover:text-text">{t.footer.terms}</a>
            <a href="mailto:hello@takely.video" className="hover:text-text">{t.footer.contact}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
