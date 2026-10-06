import { NextResponse } from "next/server";
import { z } from "zod";
import { AD, adCost } from "@/lib/models";
import { AD_LANGUAGES } from "@/lib/i18n";
import { planAd } from "@/lib/planner";
import { requireUser, supabaseAdmin } from "@/lib/supabase/server";
import { addCredits, failAd, spendCredits, startAdShoot, type AdRow } from "@/lib/jobs";

export const maxDuration = 300;

const Body = z.object({
  brief: z.string().trim().min(10).max(2000),
  productImageUrl: z.string().url(),
  language: z.string().refine((c) => AD_LANGUAGES.some((l) => l.code === c)),
  duration: z.number().int().refine((d) => (AD.durations as readonly number[]).includes(d)),
  aspect: z.enum(["9:16", "16:9", "1:1", "4:5"]),
  voiceover: z.boolean(),
  music: z.boolean().default(true),
});

export async function POST(req: Request) {
  const { user } = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  const b = parsed.data;

  const admin = supabaseAdmin();
  const id = crypto.randomUUID();
  const cost = adCost(b.duration, b.voiceover, b.music);

  // At most 3 ads in production at once per account.
  const { count } = await admin
    .from("ads")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .in("status", ["planning", "shooting", "assembling"]);
  if ((count ?? 0) >= 3) return NextResponse.json({ error: "too_many_running" }, { status: 429 });

  if (!(await spendCredits(admin, user.id, cost, "ad", `ad:${id}`))) {
    return NextResponse.json({ error: "not_enough_credits" }, { status: 402 });
  }

  const { data: ad, error } = await admin
    .from("ads")
    .insert({
      id,
      user_id: user.id,
      brief: b.brief,
      product_image_url: b.productImageUrl,
      language: b.language,
      duration: b.duration,
      aspect: b.aspect,
      voiceover: b.voiceover,
      music: b.music,
      cost,
      status: "planning",
    })
    .select()
    .single<AdRow>();
  if (error || !ad) {
    await addCredits(admin, user.id, cost, "refund-ad", `refund-ad:${id}`);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  try {
    const plan = await planAd({
      brief: b.brief,
      productImageUrl: b.productImageUrl,
      language: b.language,
      durationSec: b.duration,
      aspect: b.aspect,
    });
    const { data: planned } = await admin
      .from("ads")
      .update({ plan, title: plan.title, status: "shooting", updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single<AdRow>();
    await startAdShoot(planned!);
  } catch (e) {
    await failAd(id, e instanceof Error ? e.message : "Planning failed");
  }

  return NextResponse.json({ id });
}
