import type { Dict } from "@/lib/i18n";

const TONES = ["#1d1b18", "#171a1d", "#1c1a1f", "#191c19", "#1f1c19", "#18181b"];

/**
 * The hero visual: a live-looking storyboard (shots sliding past a playhead) with the
 * brief typed in a composer bar. Set NEXT_PUBLIC_HERO_VIDEO_URL to a real ad made with
 * Takely and it plays behind the overlay instead.
 */
export function HeroReel({ t }: { t: Dict["home"] }) {
  const video = process.env.NEXT_PUBLIC_HERO_VIDEO_URL;
  const shots = [...t.shots, ...t.shots];
  return (
    <div className="relative mx-auto aspect-[4/5] w-full max-w-[1400px] overflow-hidden rounded-[28px] border border-line bg-[#0f0f11] sm:aspect-[16/9]">
      {video ? (
        <video src={video} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <>
          <div className="absolute inset-x-0 top-[12%] flex flex-col gap-4 sm:top-[16%]">
            <span className="label-mono px-6 sm:px-10">{t.reelLabel}</span>
            <div className="relative overflow-hidden">
              <div className="reel-track flex w-max gap-4 px-6 sm:px-10">
                {shots.map((s, i) => (
                  <div
                    key={i}
                    className="relative flex aspect-[9/16] w-[34vw] max-w-[220px] shrink-0 flex-col justify-between rounded-2xl border border-line p-3 sm:w-[16vw]"
                    style={{ background: TONES[i % TONES.length] }}
                  >
                    <div className="reel-scan pointer-events-none absolute inset-0 rounded-2xl" aria-hidden="true" />
                    <span className="relative self-start rounded-md bg-ink/80 px-1.5 py-0.5 font-mono text-[11px] text-muted">
                      0:{String((i % t.shots.length) * 5).padStart(2, "0")}
                    </span>
                    <span className="relative text-[13px] font-medium text-text">
                      {String((i % t.shots.length) + 1).padStart(2, "0")} · {s}
                    </span>
                  </div>
                ))}
              </div>
              <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px bg-accent shadow-[0_0_24px_4px_rgba(212,255,90,0.35)]" aria-hidden="true" />
            </div>
          </div>
        </>
      )}
      <div className="absolute inset-x-4 bottom-4 sm:inset-x-auto sm:bottom-8 sm:left-1/2 sm:w-[min(720px,90%)] sm:-translate-x-1/2">
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-panel/90 p-3 backdrop-blur-md">
          <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#333338] bg-[#222226] font-mono text-[9px] text-faint sm:flex">PHOTO</div>
          <p className="min-w-0 flex-1 text-[14px] leading-snug text-[#e4e4e2] sm:text-[15px]">
            <span className="typing">{t.composer}</span>
          </p>
          <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0c0c0d" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5" /><path d="M5 12l7-7 7 7" /></svg>
          </span>
        </div>
      </div>
    </div>
  );
}
