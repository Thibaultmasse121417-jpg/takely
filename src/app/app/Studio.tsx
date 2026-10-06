"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Uploader } from "@/components/Uploader";
import { GenerationCard, type GenLite } from "@/components/GenerationCard";
import { AD, MODELS, adCost, costFor, type Aspect, type Kind } from "@/lib/models";
import { AD_LANGUAGES, type Dict } from "@/lib/i18n";

type Mode = "ad" | Kind;
export type AdLite = { id: string; title: string | null; status: string; thumbnail_url: string | null; duration: number; language: string; aspect: string };

const AD_ASPECTS: Aspect[] = ["9:16", "4:5", "1:1", "16:9"];

function Seg<T extends string | number>({
  label,
  options,
  value,
  onChange,
  fmt = (v) => String(v),
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  fmt?: (v: T) => string;
}) {
  return (
    <fieldset className="flex gap-1 rounded-full bg-[#0f0f11] p-1">
      <legend className="sr-only">{label}</legend>
      {options.map((o) => (
        <button
          key={String(o)}
          type="button"
          aria-pressed={o === value}
          onClick={() => onChange(o)}
          className={`rounded-full px-3 py-2 text-[13px] transition-colors ${o === value ? "bg-line text-text" : "text-muted hover:text-text"}`}
        >
          {fmt(o)}
        </button>
      ))}
    </fieldset>
  );
}

export function Studio({
  t,
  locale,
  initialMode,
  defaultLanguage,
  credits,
  recentGens,
  recentAds,
}: {
  t: Dict;
  locale: string;
  initialMode: Mode;
  defaultLanguage: string;
  credits: number;
  recentGens: GenLite[];
  recentAds: AdLite[];
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [image, setImage] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [gens, setGens] = useState<GenLite[]>(recentGens);

  // ad settings
  const [duration, setDuration] = useState<number>(30);
  const [aspect, setAspect] = useState<Aspect>("9:16");
  const [language, setLanguage] = useState(defaultLanguage);
  const [voiceover, setVoiceover] = useState(true);

  // generic settings
  const kindModels = useMemo(() => MODELS.filter((m) => m.kind === mode), [mode]);
  const [modelId, setModelId] = useState<string>(MODELS.find((m) => m.kind === (initialMode === "ad" ? "video" : initialMode))!.id);
  const model = kindModels.find((m) => m.id === modelId) ?? kindModels[0];
  const [clipLen, setClipLen] = useState<number>(5);

  function switchMode(m: Mode) {
    setMode(m);
    setError("");
    if (m !== "ad") {
      const first = MODELS.find((x) => x.kind === m)!;
      setModelId(first.id);
      if (!first.aspects.includes(aspect)) setAspect(first.aspects[0]);
      if (first.durations) setClipLen(first.durations[0]);
    }
    window.history.replaceState(null, "", m === "ad" ? "/app" : `/app?mode=${m}`);
  }

  const cost = mode === "ad" ? adCost(duration, voiceover) : model ? costFor(model, { duration: clipLen }) : 0;
  const aspects = mode === "ad" ? AD_ASPECTS : model?.aspects ?? [];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (mode === "ad" && !image) return setError(t.app.needPhoto);
    if (text.trim().length < 3) return setError(t.app.needPrompt);
    if (cost > credits) return setError(t.app.notEnough);
    setBusy(true);
    try {
      if (mode === "ad") {
        const r = await fetch("/api/ads", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ brief: text, productImageUrl: image, language, duration, aspect, voiceover }),
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error === "not_enough_credits" ? t.app.notEnough : j.error);
        router.push(`/app/ads/${j.id}`);
        return;
      }
      const r = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ model: model.id, prompt: text, imageUrl: image, aspect, duration: clipLen }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error === "not_enough_credits" ? t.app.notEnough : j.error);
      setGens((g) => [j.generation, ...g]);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  const tabs: { id: Mode; label: string }[] = [
    { id: "ad", label: t.app.newAd },
    { id: "video", label: t.app.video },
    { id: "image", label: t.app.image },
  ];

  return (
    <div className="flex flex-col items-center gap-14 px-5 py-12 sm:px-8 sm:py-16">
      <div className="flex w-full max-w-3xl flex-col gap-5">
        <h1 className="text-center text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">{t.app.greeting}</h1>

        <div role="tablist" aria-label="Mode" className="mx-auto flex gap-1 rounded-full border border-line-soft p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={mode === tab.id}
              onClick={() => switchMode(tab.id)}
              className={`rounded-full px-4 py-2 text-sm transition-colors ${mode === tab.id ? "bg-text text-ink" : "text-muted hover:text-text"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4 rounded-[20px] border border-line bg-panel p-4 sm:p-5">
          <Uploader
            value={image}
            onChange={setImage}
            label={mode === "ad" ? t.app.addPhoto : t.app.addImage}
            uploadingLabel={t.app.uploading}
          />
          <label htmlFor="brief" className="text-[13px] text-muted">{t.app.briefLabel}</label>
          <textarea
            id="brief"
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={mode === "ad" ? t.app.briefPh : t.app.promptPh}
            className="-mt-2 resize-none bg-transparent text-[17px] leading-relaxed text-text outline-none placeholder:text-faint"
          />

          <div className="flex flex-wrap items-center gap-2 border-t border-line-soft pt-4">
            {mode === "ad" ? (
              <>
                <Seg label={t.app.duration} options={AD.durations} value={duration as (typeof AD.durations)[number]} onChange={setDuration} fmt={(v) => `${v} s`} />
                <Seg label={t.app.format} options={aspects} value={aspect} onChange={setAspect} />
                <label className="relative">
                  <span className="sr-only">{t.app.language}</span>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="h-10 appearance-none rounded-full border border-line bg-transparent px-4 text-[13px] text-text outline-none hover:border-faint"
                  >
                    {AD_LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code} className="bg-panel">{l.name}</option>
                    ))}
                  </select>
                </label>
                <button type="button" aria-pressed={voiceover} onClick={() => setVoiceover((v) => !v)} className="chip" data-on={voiceover}>
                  {t.app.voice} {voiceover ? "✓" : "—"}
                </button>
              </>
            ) : (
              <>
                <label className="relative">
                  <span className="sr-only">{t.app.model}</span>
                  <select
                    value={model?.id}
                    onChange={(e) => {
                      const m = MODELS.find((x) => x.id === e.target.value)!;
                      setModelId(m.id);
                      if (!m.aspects.includes(aspect)) setAspect(m.aspects[0]);
                      if (m.durations && !m.durations.includes(clipLen)) setClipLen(m.durations[0]);
                    }}
                    className="h-10 appearance-none rounded-full border border-line bg-transparent px-4 text-[13px] text-text outline-none hover:border-faint"
                  >
                    {kindModels.map((m) => (
                      <option key={m.id} value={m.id} className="bg-panel">{m.label}</option>
                    ))}
                  </select>
                </label>
                <Seg label={t.app.format} options={aspects} value={aspects.includes(aspect) ? aspect : aspects[0]} onChange={setAspect} />
                {model?.durations && model.durations.length > 1 && (
                  <Seg label={t.app.duration} options={model.durations} value={clipLen} onChange={setClipLen} fmt={(v) => `${v} s`} />
                )}
              </>
            )}
            <div className="ml-auto flex items-center gap-3">
              <span className="font-mono text-xs text-muted">{cost} {t.app.cost}</span>
              <button type="submit" disabled={busy} className="btn-primary">
                {busy ? (mode === "ad" ? t.ad.planning + "…" : "…") : t.app.generate}
                {!busy && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                )}
              </button>
            </div>
          </div>
          {model && mode !== "ad" && <p className="text-xs text-faint">{model.blurb[locale === "fr" ? "fr" : "en"]}</p>}
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        </form>
      </div>

      <section className="flex w-full max-w-6xl flex-col gap-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-medium">{t.app.recent}</h2>
          <Link href="/app/library" className="text-[13px] text-muted hover:text-text">{t.app.library} →</Link>
        </div>
        {recentAds.length === 0 && gens.length === 0 ? (
          <p className="text-sm text-faint">{t.app.empty}</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {recentAds.map((a) => (
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
            {gens.map((g) => (
              <GenerationCard key={g.id} initial={g} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
