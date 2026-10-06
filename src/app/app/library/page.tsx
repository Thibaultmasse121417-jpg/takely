import Link from "next/link";
import { getServerDict } from "@/lib/locale";
import { requireUser } from "@/lib/supabase/server";
import { GenerationCard, type GenLite } from "@/components/GenerationCard";

export default async function LibraryPage() {
  const { sb } = await requireUser();
  const { t } = await getServerDict();
  const [{ data: ads }, { data: gens }] = await Promise.all([
    sb.from("ads").select("id, title, status, thumbnail_url, final_url, duration, language, aspect").order("created_at", { ascending: false }).limit(60),
    sb
      .from("generations")
      .select("id, kind, model, prompt, status, result_url, aspect, error")
      .is("ad_id", null)
      .order("created_at", { ascending: false })
      .limit(120),
  ]);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-10 px-5 py-12 sm:px-8">
      <h1 className="text-3xl font-semibold tracking-[-0.035em]">{t.app.library}</h1>

      {(ads ?? []).length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="label-mono">{t.app.newAd}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {ads!.map((a) => (
              <Link key={a.id} href={`/app/ads/${a.id}`} className="flex flex-col gap-2">
                <div className="overflow-hidden rounded-xl border border-line bg-panel-2" style={{ aspectRatio: a.aspect.replace(":", "/") }}>
                  {a.thumbnail_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.thumbnail_url} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <span className="line-clamp-1 text-[13px]">{a.title ?? "…"}</span>
                <span className="label-mono">{a.duration} s · {a.language} · {a.status}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="label-mono">{t.app.video} · {t.app.image}</h2>
        {(gens ?? []).length === 0 ? (
          <p className="text-sm text-faint">{t.app.empty}</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {(gens as GenLite[]).map((g) => (
              <GenerationCard key={g.id} initial={g} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
