import { getServerDict } from "@/lib/locale";
import { AD_LANGUAGES } from "@/lib/i18n";
import { requireUser } from "@/lib/supabase/server";
import { Studio, type AdLite } from "./Studio";
import type { GenLite } from "@/components/GenerationCard";

export default async function StudioPage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const { mode } = await searchParams;
  const { sb, user } = await requireUser();
  const { locale, t } = await getServerDict();

  const [{ data: profile }, { data: gens }, { data: ads }] = await Promise.all([
    sb.from("profiles").select("credits").eq("id", user!.id).maybeSingle(),
    sb
      .from("generations")
      .select("id, kind, model, prompt, status, result_url, aspect, error")
      .is("ad_id", null)
      .order("created_at", { ascending: false })
      .limit(10),
    sb
      .from("ads")
      .select("id, title, status, thumbnail_url, duration, language, aspect")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const initialMode = mode === "video" || mode === "image" ? mode : "ad";
  return (
    <Studio
      key={initialMode}
      t={t}
      initialMode={initialMode}
      defaultLanguage={AD_LANGUAGES.some((l) => l.code === locale) ? locale : "en"}
      credits={profile?.credits ?? 0}
      recentGens={(gens ?? []) as GenLite[]}
      recentAds={(ads ?? []) as AdLite[]}
    />
  );
}
