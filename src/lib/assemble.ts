import "server-only";
import { execFile } from "child_process";
import { mkdtemp, readFile, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { promisify } from "util";
import ffmpegPath from "ffmpeg-static";
import { AD } from "./models";
import { cropFilter, derivableFormats } from "./formats";
import { montageArgs } from "./montage";
import { supabaseAdmin } from "./supabase/server";
import type { AdRow, GenRow } from "./jobs";

const run = promisify(execFile);
const ffmpeg = () => ffmpegPath as unknown as string;

async function download(url: string, path: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download failed (${res.status}) ${url}`);
  await writeFile(path, Buffer.from(await res.arrayBuffer()));
}

/**
 * Final edit of a product ad, done on our server with ffmpeg: shots + voiceover + ducked
 * music → one video in the ad's format, plus every other format that can be cropped from it.
 * The caller must already have moved the ad to `assembling`.
 */
export async function assembleAd(adId: string) {
  const sb = supabaseAdmin();
  const { data: ad } = await sb.from("ads").select().eq("id", adId).single<AdRow>();
  if (!ad || ad.status !== "assembling" || !ad.plan) return;
  const { data: gens } = await sb.from("generations").select().eq("ad_id", adId);
  const all = (gens ?? []) as GenRow[];
  const done = (role: string, i: number | null = null) =>
    all.find((g) => g.role === role && g.shot_index === i && g.status === "completed" && g.result_url)?.result_url ?? null;

  const clipUrls = ad.plan.shots.map((_, i) => done("clip", i));
  if (clipUrls.some((u) => !u)) return; // not ready (advanceAd will call again)

  const dir = await mkdtemp(join(tmpdir(), "takely-ad-"));
  try {
    const clips = await Promise.all(
      clipUrls.map(async (u, i) => {
        const p = join(dir, `clip${i}.mp4`);
        await download(u!, p);
        return p;
      }),
    );
    const voiceUrl = ad.voiceover ? done("voice") : null;
    const musicUrl = ad.music ? done("music") : null;
    const voice = voiceUrl ? join(dir, "voice.audio") : null;
    const music = musicUrl ? join(dir, "music.audio") : null;
    if (voice) await download(voiceUrl!, voice);
    if (music) await download(musicUrl!, music);

    const master = join(dir, "master.mp4");
    await run(ffmpeg(), montageArgs({ clips, voice, music, aspect: ad.aspect, clipSeconds: AD.clipSeconds, out: master }), {
      timeout: 180_000,
      maxBuffer: 1 << 24,
    });

    const upload = async (file: string, aspect: string) => {
      const path = `${ad.user_id}/${ad.id}/${aspect.replace(":", "x")}.mp4`;
      const { error } = await sb.storage.from("outputs").upload(path, await readFile(file), { contentType: "video/mp4", upsert: true });
      if (error) throw error;
      return sb.storage.from("outputs").getPublicUrl(path).data.publicUrl;
    };

    const formats: Record<string, string> = { [ad.aspect]: await upload(master, ad.aspect) };
    for (const target of derivableFormats(ad.aspect)) {
      try {
        const out = join(dir, `${target.replace(":", "x")}.mp4`);
        await run(ffmpeg(), ["-y", "-i", master, "-vf", cropFilter(target), "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p", "-c:a", "copy", "-movflags", "+faststart", out], { timeout: 120_000 });
        formats[target] = await upload(out, target);
      } catch (e) {
        console.error("format", target, e); // the main format is still delivered
      }
    }

    await sb
      .from("ads")
      .update({
        status: "completed",
        final_url: formats[ad.aspect],
        formats,
        thumbnail_url: done("keyframe", 0),
        updated_at: new Date().toISOString(),
      })
      .eq("id", adId)
      .eq("status", "assembling");
  } catch (e) {
    console.error("assembleAd", adId, e);
    const { failAd } = await import("./jobs");
    await failAd(adId, "Le montage a échoué.");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
