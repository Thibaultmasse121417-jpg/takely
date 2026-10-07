import Link from "next/link";
import { Logo } from "@/components/Logo";
import { LangSwitch } from "@/components/LangSwitch";
import type { Dict, Locale } from "@/lib/i18n";

export function SiteHeader({ t, locale }: { t: Dict; locale: Locale }) {
  const n = t.home.nav;
  return (
    <header className="sticky top-[env(safe-area-inset-top,0px)] z-40 border-b border-white/5 bg-ink/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-4 px-5 sm:px-8">
        <div className="flex items-center gap-10">
          <Logo />
          <nav aria-label="Main" className="hidden items-center gap-7 text-[14px] text-muted lg:flex">
            <Link href="/#create" className="hover:text-text">{n.ads}</Link>
            <Link href="/#studio" className="hover:text-text">{n.studio}</Link>
            <Link href="/pricing" className="hover:text-text">{n.pricing}</Link>
            <Link href="/#for" className="hover:text-text">{n.business}</Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:block"><LangSwitch locale={locale} /></div>
          <Link href="/login" className="hidden px-3 py-2.5 text-[14px] text-text hover:text-accent sm:inline-flex">{t.nav.login}</Link>
          <Link href="/app" className="inline-flex h-10 items-center rounded-full bg-text px-4 text-[14px] font-medium text-ink hover:opacity-90">
            {n.start}
          </Link>
        </div>
      </div>
    </header>
  );
}
