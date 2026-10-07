import { FORMAT_SIZES } from "./formats";

/**
 * Builds the ffmpeg arguments that cut the shots together, lay the voiceover on top,
 * duck the music underneath and fade in/out. Pure function so it can be tested alone.
 */
export function montageArgs(opts: {
  clips: string[];
  voice?: string | null;
  music?: string | null;
  /** PNG burned in the bottom-right corner (free plan). */
  watermark?: string | null;
  aspect: string;
  clipSeconds: number;
  out: string;
}): string[] {
  const [W, H] = FORMAT_SIZES[opts.aspect] ?? FORMAT_SIZES["9:16"];
  const n = opts.clips.length;
  const T = n * opts.clipSeconds;
  const args: string[] = ["-y"];
  opts.clips.forEach((c) => args.push("-i", c));
  let idx = n;
  const voiceIdx = opts.voice ? idx++ : -1;
  const musicIdx = opts.music ? idx++ : -1;
  const wmIdx = opts.watermark ? idx : -1;
  if (opts.voice) args.push("-i", opts.voice);
  if (opts.music) args.push("-i", opts.music);
  if (opts.watermark) args.push("-i", opts.watermark);

  const f: string[] = [];
  for (let i = 0; i < n; i++) {
    f.push(
      `[${i}:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},fps=30,setsar=1,` +
        `trim=duration=${opts.clipSeconds},setpts=PTS-STARTPTS[v${i}]`,
    );
  }
  f.push(
    `${Array.from({ length: n }, (_, i) => `[v${i}]`).join("")}concat=n=${n}:v=1:a=0,` +
      `fade=t=in:st=0:d=0.3,fade=t=out:st=${(T - 0.6).toFixed(2)}:d=0.6${opts.watermark ? "[vcut]" : "[vout]"}`,
  );
  if (opts.watermark) {
    const wmW = Math.round(Math.min(W, H) * 0.42);
    const margin = Math.round(Math.min(W, H) * 0.04);
    f.push(`[${wmIdx}:v]scale=${wmW}:-1[wm]`);
    f.push(`[vcut][wm]overlay=W-w-${margin}:H-h-${margin}[vout]`);
  }

  const fadeOut = `afade=t=out:st=${Math.max(0, T - 1.5).toFixed(2)}:d=1.5`;
  let audio: string | null = null;
  if (voiceIdx >= 0 && musicIdx >= 0) {
    f.push(`[${voiceIdx}:a]adelay=400|400,apad[voice]`);
    f.push(`[${musicIdx}:a]volume=0.22,apad,${fadeOut}[mus]`);
    f.push(`[voice][mus]amix=inputs=2:duration=longest:normalize=0[aout]`);
    audio = "[aout]";
  } else if (voiceIdx >= 0) {
    f.push(`[${voiceIdx}:a]adelay=400|400,apad[aout]`);
    audio = "[aout]";
  } else if (musicIdx >= 0) {
    f.push(`[${musicIdx}:a]volume=0.7,apad,${fadeOut}[aout]`);
    audio = "[aout]";
  }

  args.push("-filter_complex", f.join(";"), "-map", "[vout]");
  if (audio) args.push("-map", audio, "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2");
  args.push("-t", String(T), "-r", "30", "-c:v", "libx264", "-preset", "veryfast", "-crf", "19", "-pix_fmt", "yuv420p", "-movflags", "+faststart", opts.out);
  return args;
}
