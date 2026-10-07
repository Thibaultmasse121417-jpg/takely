import Link from "next/link";
import { Logo } from "@/components/Logo";
import { LangSwitch } from "@/components/LangSwitch";
import type { Dict, Locale } from "@/lib/i18n";

export function SiteFooter({ t, locale }: { t: Dict; locale: Locale }) {
  const f = t.home.footer;
  const cols: { title: string; links: [string, string][] }[] = [
    { title: f.product, links: [[f.links.ads, "/app"], [f.links.studio, "/app?mode=video"], [f.links.pricing, "/pricing"], [f.links.login, "/login"]] },
    { title: f.company, links: [[f.links.business, "/#faq"], [f.links.contact, "/legal#mentions"]] },
    { title: f.legal, links: [[f.links.legal, "/legal#mentions"], [f.links.terms, "/legal#cgv"], [f.links.privacy, "/legal#confidentialite"]] },
  ];
  return (
    <footer className="border-t border-line-soft">
      <div className="mx-auto grid max-w-[1400px] gap-12 px-5 py-16 sm:px-8 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="flex flex-col gap-4">
          <Logo />
          <p className="max-w-xs text-sm text-muted">{f.tagline}</p>
          <LangSwitch locale={locale} />
        </div>
        {cols.map((c) => (
          <div key={c.title} className="flex flex-col gap-3">
            <span className="label-mono">{c.title}</span>
            {c.links.map(([label, href]) => (
              <Link key={label} href={href} className="text-sm text-muted hover:text-text">{label}</Link>
            ))}
          </div>
        ))}
      </div>
      <div className="mx-auto max-w-[1400px] px-5 pb-10 text-[13px] text-faint sm:px-8">© {new Date().getFullYear()} takely</div>
    </footer>
  );
}
