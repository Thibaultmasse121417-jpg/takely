"use client";
import { useEffect, useState } from "react";

export type GenLite = {
  id: string;
  kind: string;
  model: string;
  prompt: string | null;
  status: "queued" | "running" | "completed" | "failed";
  result_url: string | null;
  aspect: string | null;
  error: string | null;
};

const ratio = (a: string | null) => (a ?? "9:16").replace(":", "/");

export function GenerationCard({ initial }: { initial: GenLite }) {
  const [gen, setGen] = useState(initial);
  const pending = gen.status === "queued" || gen.status === "running";

  useEffect(() => {
    if (!pending) return;
    const iv = setInterval(async () => {
      const r = await fetch(`/api/generations/${gen.id}`);
      if (r.ok) setGen((await r.json()).generation);
    }, 5000);
    return () => clearInterval(iv);
  }, [gen.id, pending]);

  return (
    <article className="flex flex-col gap-2">
      <div
        className="relative flex items-center justify-center overflow-hidden rounded-xl border border-line bg-panel-2"
        style={{ aspectRatio: ratio(gen.aspect) }}
      >
        {gen.status === "completed" && gen.result_url ? (
          gen.kind === "video" || gen.kind === "compose" ? (
            <video src={gen.result_url} controls playsInline loop className="h-full w-full object-cover" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={gen.result_url} alt={gen.prompt ?? ""} className="h-full w-full object-cover" />
          )
        ) : gen.status === "failed" ? (
          <span className="px-3 text-center text-xs text-danger">{gen.error ?? "Failed"}</span>
        ) : (
          <span className="flex items-center gap-2 font-mono text-xs text-muted">
            <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
            {gen.status === "queued" ? "queued" : "generating"}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="line-clamp-1 text-[13px]">{gen.prompt}</span>
        {gen.status === "completed" && gen.result_url && (
          <a href={gen.result_url} download target="_blank" rel="noreferrer" className="shrink-0 text-xs text-muted hover:text-text">↓</a>
        )}
      </div>
      <span className="label-mono">{gen.model}</span>
    </article>
  );
}
