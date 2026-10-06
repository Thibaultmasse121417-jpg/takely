import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { fal, webhookUrlFor } from "./fal";
import { AD, adCost, extractResult } from "./models";
import { supabaseAdmin } from "./supabase/server";
import type { Plan } from "./planner";

export type GenRow = {
  id: string;
  user_id: string;
  kind: "image" | "video" | "audio" | "compose";
  model: string;
  endpoint: string;
  prompt: string | null;
  input: Record<string, unknown>;
  aspect: string | null;
  status: "queued" | "running" | "completed" | "failed";
  fal_request_id: string | null;
  result_url: string | null;
  thumbnail_url: string | null;
  cost: number;
  error: string | null;
  ad_id: string | null;
  role: "keyframe" | "clip" | "voice" | "final" | null;
  shot_index: number | null;
  created_at: string;
};

export type AdRow = {
  id: string;
  user_id: string;
  brief: string;
  product_image_url: string;
  language: string;
  duration: number;
  aspect: string;
  voiceover: boolean;
  title: string | null;
  plan: Plan | null;
  status: "planning" | "shooting" | "assembling" | "completed" | "failed";
  final_url: string | null;
  thumbnail_url: string | null;
  cost: number;
  error: string | null;
  created_at: string;
};

export async function spendCredits(sb: SupabaseClient, userId: string, amount: number, reason: string, ref: string) {
  if (amount <= 0) return true;
  const { data, error } = await sb.rpc("spend_credits", { p_user: userId, p_amount: amount, p_reason: reason, p_ref: ref });
  if (error) throw error;
  return data === true;
}

export async function addCredits(sb: SupabaseClient, userId: string, amount: number, reason: string, ref: string) {
  if (amount <= 0) return false;
  const { data, error } = await sb.rpc("add_credits", { p_user: userId, p_amount: amount, p_reason: reason, p_ref: ref });
  if (error) throw error;
  return data === true;
}

/**
 * Inserts a generation row, then submits it to fal. The row is inserted first so the
 * unique (ad_id, role, shot) index stops a racing webhook from submitting the same step twice.
 * Returns null when another worker already owns that step.
 */
export async function submitGeneration(args: {
  userId: string;
  kind: GenRow["kind"];
  model: string;
  endpoint: string;
  input: Record<string, unknown>;
  prompt?: string | null;
  aspect?: string | null;
  cost?: number;
  adId?: string;
  role?: GenRow["role"];
  shotIndex?: number | null;
}): Promise<GenRow | null> {
  const sb = supabaseAdmin();
  const { data: row, error } = await sb
    .from("generations")
    .insert({
      user_id: args.userId,
      kind: args.kind,
      model: args.model,
      endpoint: args.endpoint,
      input: args.input,
      prompt: args.prompt ?? null,
      aspect: args.aspect ?? null,
      cost: args.cost ?? 0,
      ad_id: args.adId ?? null,
      role: args.role ?? null,
      shot_index: args.shotIndex ?? null,
      status: "queued",
    })
    .select()
    .single();
  if (error) {
    if (error.code === "23505") return null; // step already submitted by someone else
    throw error;
  }

  try {
    const queued = await fal.queue.submit(args.endpoint, {
      input: args.input,
      webhookUrl: webhookUrlFor(row.id),
    });
    const { data: updated } = await sb
      .from("generations")
      .update({ fal_request_id: queued.request_id, status: "running", updated_at: new Date().toISOString() })
      .eq("id", row.id)
      .select()
      .single();
    return (updated ?? row) as GenRow;
  } catch (e) {
    await settleGeneration(row.id, { ok: false, error: errorText(e) });
    return { ...(row as GenRow), status: "failed", error: errorText(e) };
  }
}

function errorText(e: unknown): string {
  if (e && typeof e === "object") {
    const anyE = e as { body?: { detail?: unknown }; message?: unknown };
    const detail = anyE.body?.detail;
    if (detail) return typeof detail === "string" ? detail : JSON.stringify(detail).slice(0, 500);
    if (anyE.message) return String(anyE.message).slice(0, 500);
  }
  return String(e).slice(0, 500);
}

/** Moves a generation to its final state exactly once, refunds failures and advances its ad. */
export async function settleGeneration(id: string, outcome: { ok: true; data: unknown } | { ok: false; error: string }) {
  const sb = supabaseAdmin();
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (outcome.ok) {
    const { url, thumb } = extractResult(outcome.data);
    if (!url) {
      return settleGeneration(id, { ok: false, error: "The model returned no media." });
    }
    Object.assign(patch, { status: "completed", result_url: url, thumbnail_url: thumb });
  } else {
    Object.assign(patch, { status: "failed", error: outcome.error });
  }

  const { data: claimed } = await sb
    .from("generations")
    .update(patch)
    .eq("id", id)
    .in("status", ["queued", "running"])
    .select()
    .maybeSingle();
  if (!claimed) return; // already settled

  const gen = claimed as GenRow;
  if (gen.status === "failed" && gen.cost > 0) {
    await addCredits(sb, gen.user_id, gen.cost, "refund", `refund:${gen.id}`);
  }
  if (gen.ad_id) await advanceAd(gen.ad_id);
}

/** Polling fallback (local dev, missed webhooks): asks fal where the job is. */
export async function syncGeneration(gen: GenRow): Promise<void> {
  if (!["queued", "running"].includes(gen.status) || !gen.fal_request_id) return;
  try {
    const st = await fal.queue.status(gen.endpoint, { requestId: gen.fal_request_id, logs: false });
    if (st.status !== "COMPLETED") return;
  } catch {
    return;
  }
  try {
    const res = await fal.queue.result(gen.endpoint, { requestId: gen.fal_request_id });
    await settleGeneration(gen.id, { ok: true, data: res.data });
  } catch (e) {
    await settleGeneration(gen.id, { ok: false, error: errorText(e) });
  }
}

/* ------------------------------------------------------------------ */
/* Product-ad pipeline: plan → keyframe per shot → clip per shot (+ voice) → compose */
/* ------------------------------------------------------------------ */

const KONTEXT_ASPECTS: Record<string, string> = { "9:16": "9:16", "16:9": "16:9", "1:1": "1:1", "4:5": "3:4" };

export async function startAdShoot(ad: AdRow) {
  const plan = ad.plan!;
  const jobs: Promise<unknown>[] = plan.shots.map((shot, i) =>
    submitGeneration({
      userId: ad.user_id,
      kind: "image",
      model: "ad-keyframe",
      endpoint: AD.keyframeEndpoint,
      prompt: shot.keyframe_prompt,
      aspect: ad.aspect,
      adId: ad.id,
      role: "keyframe",
      shotIndex: i,
      input: {
        prompt: `${shot.keyframe_prompt}\nThe product must stay exactly identical to the reference photo: ${plan.product_description}. Consistent elements: ${plan.locked_elements.join(", ")}. Photorealistic commercial photography, no text.`,
        image_url: ad.product_image_url,
        aspect_ratio: KONTEXT_ASPECTS[ad.aspect] ?? "9:16",
        num_images: 1,
        output_format: "jpeg",
      },
    }),
  );
  if (ad.voiceover && plan.voiceover.trim()) {
    jobs.push(
      submitGeneration({
        userId: ad.user_id,
        kind: "audio",
        model: "ad-voice",
        endpoint: AD.voiceEndpoint,
        prompt: plan.voiceover,
        adId: ad.id,
        role: "voice",
        input: { text: plan.voiceover, voice: "Aria", stability: 0.5, similarity_boost: 0.75, speed: 1 },
      }),
    );
  }
  await Promise.all(jobs);
}

export async function failAd(adId: string, reason: string) {
  const sb = supabaseAdmin();
  const { data: ad } = await sb
    .from("ads")
    .update({ status: "failed", error: reason, updated_at: new Date().toISOString() })
    .eq("id", adId)
    .in("status", ["planning", "shooting", "assembling"])
    .select()
    .maybeSingle();
  if (!ad) return;
  // Refund everything except the planning step.
  const refund = Math.max(0, ad.cost - AD.credits.planning);
  await addCredits(sb, ad.user_id, refund, "refund-ad", `refund-ad:${ad.id}`);
}

export async function advanceAd(adId: string) {
  const sb = supabaseAdmin();
  const { data: ad } = await sb.from("ads").select().eq("id", adId).single<AdRow>();
  if (!ad || !ad.plan || ["completed", "failed", "planning"].includes(ad.status)) return;

  const { data: gens } = await sb.from("generations").select().eq("ad_id", adId);
  const all = (gens ?? []) as GenRow[];
  const shotCount = ad.plan.shots.length;
  const find = (role: GenRow["role"], i: number | null = null) =>
    all.find((g) => g.role === role && (i === null ? g.shot_index === null : g.shot_index === i));

  // A missing voiceover isn't worth losing the whole ad for; any other failed step is.
  const failed = all.find((g) => g.status === "failed" && g.role !== "voice");
  if (failed) return failAd(adId, failed.error ?? "A step failed.");

  if (ad.status === "shooting") {
    // Animate every shot whose keyframe is ready.
    for (let i = 0; i < shotCount; i++) {
      const kf = find("keyframe", i);
      if (kf?.status === "completed" && kf.result_url && !find("clip", i)) {
        const shot = ad.plan.shots[i];
        await submitGeneration({
          userId: ad.user_id,
          kind: "video",
          model: "ad-clip",
          endpoint: AD.clipEndpoint,
          prompt: shot.motion_prompt,
          aspect: ad.aspect,
          adId,
          role: "clip",
          shotIndex: i,
          input: {
            prompt: `${shot.motion_prompt} Keep the product exactly as in the first frame. Cinematic, smooth, realistic.`,
            image_url: kf.result_url,
            duration: String(AD.clipSeconds),
            negative_prompt: "blur, distort, morphing product, text, watermark, low quality",
          },
        });
      }
    }

    const clips = Array.from({ length: shotCount }, (_, i) => find("clip", i));
    const clipsDone = clips.every((c) => c?.status === "completed" && c.result_url);
    const voice = find("voice");
    const voiceDone = !ad.voiceover || !voice || voice.status === "completed" || voice.status === "failed";
    if (!clipsDone || !voiceDone) return;

    // Exactly one worker moves the ad to assembling.
    const { data: won } = await sb
      .from("ads")
      .update({ status: "assembling", updated_at: new Date().toISOString() })
      .eq("id", adId)
      .eq("status", "shooting")
      .select()
      .maybeSingle();
    if (!won) return;

    const ms = AD.clipSeconds * 1000;
    const tracks: Record<string, unknown>[] = [
      {
        id: "video",
        type: "video",
        keyframes: clips.map((c, i) => ({ url: c!.result_url, timestamp: i * ms, duration: ms })),
      },
    ];
    if (voice?.status === "completed" && voice.result_url) {
      tracks.push({ id: "voice", type: "audio", keyframes: [{ url: voice.result_url, timestamp: 0, duration: shotCount * ms }] });
    }
    await submitGeneration({
      userId: ad.user_id,
      kind: "compose",
      model: "ad-compose",
      endpoint: AD.composeEndpoint,
      adId,
      role: "final",
      aspect: ad.aspect,
      input: { tracks },
    });
    return;
  }

  if (ad.status === "assembling") {
    const final = find("final");
    if (final?.status === "completed" && final.result_url) {
      const firstKf = find("keyframe", 0);
      await sb
        .from("ads")
        .update({
          status: "completed",
          final_url: final.result_url,
          thumbnail_url: final.thumbnail_url ?? firstKf?.result_url ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", adId)
        .eq("status", "assembling");
    }
  }
}

export { adCost };
