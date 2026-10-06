import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { LangSwitch } from "@/components/LangSwitch";
import { LogoutButton } from "@/components/LogoutButton";
import { getServerDict } from "@/lib/locale";
import { requireUser } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { sb, user } = await requireUser();
  if (!user) redirect("/login");
  const { locale, t } = await getServerDict();
  const { data: profile } = await sb.from("profiles").select("credits").eq("id", user.id).maybeSingle();
  const credits = profile?.credits ?? 0;

  const nav = [
    { href: "/app", label: t.app.newAd, icon: "M12 5v14M5 12h14" },
    { href: "/app?mode=video", label: t.app.video, icon: "M4 6h12v12H4zM16 10l4-2v8l-4-2" },
    { href: "/app?mode=image", label: t.app.image, icon: "M4 5h16v14H4zM4 15l5-5 4 4 3-3 4 4" },
    { href: "/app/library", label: t.app.library, icon: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" },
  ];

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="flex shrink-0 flex-col gap-1.5 border-b border-line-soft px-3.5 py-5 md:sticky md:top-0 md:h-screen md:w-60 md:border-b-0 md:border-r">
        <div className="px-2.5 pb-4"><Logo href="/app" /></div>
        <nav aria-label="App" className="flex flex-row flex-wrap gap-1 md:flex-col">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-panel-2 hover:text-text">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={n.icon} /></svg>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="mt-4 flex flex-col gap-3 md:mt-auto">
          <div className="flex flex-col gap-2.5 rounded-2xl border border-line-soft p-4">
            <div className="flex justify-between text-[13px]">
              <span className="text-muted">{t.app.credits}</span>
              <span className="font-mono">{credits}</span>
            </div>
            <Link href="/app/billing" className="text-[13px] text-accent hover:underline">{t.app.recharge}</Link>
          </div>
          <div className="flex items-center justify-between gap-2">
            <LangSwitch locale={locale} />
            <LogoutButton label={t.app.logout} />
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
