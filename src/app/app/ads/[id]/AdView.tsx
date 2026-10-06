"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Dict } from "@/lib/i18n";

type Gen = { id: string; role: string | null; shot_index: number | null; status: string; result_url: string | null };
type Ad = {
  id: string;
  title: string | null;
  brief: string;
  product_image_url: string;
  duration: number;
  aspect: string;
  language: string;
  voiceover: boolean;
  music: boolean;
  formats: Record<string, string> | null;
  status: "planning" | "shooting" | "assembling" | "completed" | "failed";
  plan: { shots: { title: string; description: string }[]; voiceover: string; locked_elements: string[] } | null;
  final_url: string | null;
  error: string | null;
};

const ORDER = ["9:16", "4:5", "1:1", "16:9"];

function Step({ state, label }: { state: "done" | "active" | "todo"; label: string }) {
  return (
    <li className="flex items-center gap-3 py-2 text-sm">
      {state === "done" ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10" /></svg>
      ) : state === "active" ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="animate-spin" aria-hidden="true"><path d="M12 3a9 9 0 109 9" /></svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#55555b" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="8" /></svg>
      )}
      <span className={state === "todo" ? "text-faint" : state === "active" ? "font-medium" : "text-[#d8d8d6]"}>{label}</span>
    </li>
  );
}

export function AdView({ id, t }: { id: string; t: Dict["ad"] }) {
  const [ad, setAd] = useState<Ad | null>(null);
  const [gens, setGens] = useState<Gen[]>([]);

  useEffect(() => {
    let stop = false;
    async function tick() {
      const r = await fetch(`/api/ads/${id}`);
      if (!r.ok || stop) return;
      const j = await r.json();
      setAd(j.ad);
      setGens(j.generations);
      if (!["completed", "failed"].includes(j.ad.status)) setTimeout(tick, 6000);
    }
    tick();
    return () => {
      stop = true;
    };
  }, [id]);

  if (!ad) return <div className="p-10 font-mono text-sm text-muted">…</div>;

  const shots = ad.plan?.shots ?? [];
  const g = (role: string, i: number | null = null) => gens.find((x) => x.role === role && x.shot_index === i);
  const keyframesDone = shots.length > 0 && shots.every((_, i) => g("keyframe", i)?.status === "completed");
  const clipsDone = shots.length > 0 && shots.every((_, i) => g("clip", i)?.status === "completed");
  const voice = g("voice");
  const music = g("music");
  const order = ["planning", "shooting", "assembling", "completed"];
  const at = order.indexOf(ad.status);
  const s = (done: boolean, active: boolean) => (done ? "done" : active ? "active" : "todo") as "done" | "active" | "todo";
  const clipsShot = gens.filter((x) => x.role === "clip" && x.status === "completed").length;

  return (
    <div className="flex flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft px-5 py-3.5 sm:px-8">
        <div className="flex items-center gap-3">
          <Link href="/app" aria-label={t.back} className="flex h-11 w-11 items-center justify-center rounded-xl text-muted hover:text-text">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
          </Link>
          <span className="font-medium">{ad.title ?? "…"}</span>
          <span className="rounded-full border border-line px-2.5 py-0.5 font-mono text-xs text-muted">{ad.duration} s · {ad.aspect} · {ad.language.toUpperCase()}</span>
          {ad.status === "completed" && <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-ink">{t.completed}</span>}
          {ad.status === "failed" && <span className="rounded-full border border-danger px-2.5 py-0.5 text-xs text-danger">{t.failed}</span>}
        </div>
        {ad.final_url && (
          <a href={ad.final_url} download target="_blank" rel="noreferrer" className="btn-primary">{t.download} · {ad.aspect}</a>
        )}
      </header>

      {ad.status !== "completed" && ad.status !== "failed" && (
        <div className="h-0.5 bg-panel-2">
          <div className="h-0.5 bg-accent transition-all" style={{ width: `${Math.max(5, ((at + (shots.length ? clipsShot / shots.length : 0)) / 3) * 100)}%` }} />
        </div>
      )}

      <div className="mx-auto flex w-full max-w-[1360px] flex-wrap items-start gap-10 px-5 py-10 sm:px-8">
        <aside className="flex max-w-sm flex-[1_1_300px] flex-col gap-7">
          <div className="flex items-start gap-3.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ad.product_image_url} alt="" className="h-16 w-16 shrink-0 rounded-xl border border-[#333338] object-cover" />
            <p className="text-sm text-muted">{ad.brief}</p>
          </div>

          <div>
            <h2 className="label-mono mb-2">{t.production}</h2>
            <ul>
              <Step state={s(at > 0, at === 0)} label={t.planning} />
              <Step state={s(keyframesDone, at === 1 && !keyframesDone)} label={t.keyframes} />
              <Step state={s(clipsDone, at === 1 && keyframesDone)} label={`${t.clips} (${clipsShot}/${shots.length || "–"})`} />
              {ad.voiceover && <Step state={s(voice?.status === "completed", !!voice && voice.status !== "completed")} label={t.voice} />}
              {ad.music && <Step state={s(music?.status === "completed", !!music && music.status !== "completed")} label={t.music} />}
              <Step state={s(at >= 3, at === 2)} label={t.assembling} />
            </ul>
          </div>

          {ad.status === "completed" && ad.formats && Object.keys(ad.formats).length > 0 && (
            <div className="card flex flex-col gap-1 p-4">
              <span className="mb-1 text-[13px] font-medium">{t.formats}</span>
              {Object.entries(ad.formats)
                .sort(([a], [b]) => ORDER.indexOf(a) - ORDER.indexOf(b))
                .map(([aspect, url]) => (
                  <a key={aspect} href={url} download target="_blank" rel="noreferrer" className="flex min-h-11 items-center justify-between gap-3 border-b border-line-soft py-2 text-[13px] last:border-0 hover:text-accent">
                    <span><span className="font-mono">{aspect}</span> <span className="text-faint">· {aspect === "9:16" ? t.story : aspect === "4:5" ? t.feed : aspect === "1:1" ? t.square : t.wide}</span></span>
                    <span aria-hidden="true">↓</span>
                  </a>
                ))}
            </div>
          )}

          {ad.status === "failed" && <p role="alert" className="text-sm text-danger">{t.refunded}{ad.error ? ` (${ad.error})` : ""}</p>}

          {ad.plan?.voiceover && ad.voiceover && (
            <div className="card flex flex-col gap-2 p-4">
              <span className="text-[13px] font-medium">{t.script}</span>
              <p className="text-[13px] leading-relaxed text-muted">{ad.plan.voiceover}</p>
            </div>
          )}
        </aside>

        <section className="flex min-w-0 flex-[999_1_560px] flex-col gap-6">
          {ad.final_url && (
            <div className="flex justify-center rounded-[20px] border border-line-soft bg-[#111113] p-6">
              <video src={ad.final_url} controls playsInline className="max-h-[70vh] rounded-xl" style={{ aspectRatio: ad.aspect.replace(":", "/") }} />
            </div>
          )}

          <div className="flex items-baseline justify-between">
            <h1 className="text-xl font-semibold tracking-[-0.02em]">{t.shots} · {shots.length || "…"}</h1>
          </div>
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
            {(shots.length ? shots : Array.from({ length: Math.round(ad.duration / 5) }, () => null)).map((shot, i) => {
              const kf = g("keyframe", i);
              const clip = g("clip", i);
              const status = clip?.status === "completed" ? t.done : clip || kf ? t.running : t.queued;
              return (
                <article key={i} className="flex flex-col gap-2.5">
                  <div
                    className={`relative flex flex-col justify-between overflow-hidden rounded-xl border bg-panel-2 ${clip && clip.status !== "completed" ? "border-accent" : "border-line"}`}
                    style={{ aspectRatio: ad.aspect.replace(":", "/") }}
                  >
                    {clip?.status === "completed" && clip.result_url ? (
                      <video src={clip.result_url} muted loop playsInline autoPlay className="absolute inset-0 h-full w-full object-cover" />
                    ) : kf?.status === "completed" && kf.result_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={kf.result_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80" />
                    ) : null}
                    <span className="relative m-2 self-start rounded-md bg-ink/80 px-1.5 py-0.5 font-mono text-[11px] text-muted">0:{String(i * 5).padStart(2, "0")}</span>
                    <span className="relative m-2 self-start rounded-full bg-ink/80 px-2 py-0.5 text-[11px]">{status}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{String(i + 1).padStart(2, "0")} · {shot?.title ?? "…"}</span>
                    {shot && <span className="text-[13px] text-faint">{shot.description}</span>}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
