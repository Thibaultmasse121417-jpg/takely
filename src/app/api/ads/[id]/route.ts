import { NextResponse } from "next/server";
import { requireUser, supabaseAdmin } from "@/lib/supabase/server";
import { advanceAd, syncGeneration, type AdRow, type GenRow } from "@/lib/jobs";

export const maxDuration = 60;

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { user } = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = supabaseAdmin();
  const loadAd = () => admin.from("ads").select().eq("id", id).eq("user_id", user.id).maybeSingle<AdRow>();
  const loadGens = () => admin.from("generations").select().eq("ad_id", id).order("created_at");

  let { data: ad } = await loadAd();
  if (!ad) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (ad.status === "shooting" || ad.status === "assembling") {
    // Polling fallback for jobs whose webhook hasn't arrived (always the case in local dev).
    const { data: pending } = await admin
      .from("generations")
      .select()
      .eq("ad_id", id)
      .in("status", ["queued", "running"]);
    await Promise.all(((pending ?? []) as GenRow[]).map(syncGeneration));
    await advanceAd(id);
    ad = (await loadAd()).data ?? ad;
  }

  const { data: gens } = await loadGens();
  return NextResponse.json({ ad, generations: gens ?? [] });
}
