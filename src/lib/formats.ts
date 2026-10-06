/** Output sizes and crop rules for the social formats (pure helpers, no I/O). */
export const FORMAT_SIZES: Record<string, [number, number]> = {
  "9:16": [1080, 1920],
  "4:5": [1080, 1350],
  "1:1": [1080, 1080],
  "16:9": [1920, 1080],
};
const ratio = (a: string) => {
  const [w, h] = a.split(":").map(Number);
  return w / h;
};

/** Formats worth cropping from a source: the crop must keep at least 55 % of the frame. */
export function derivableFormats(source: string): string[] {
  const rs = ratio(source);
  return Object.keys(FORMAT_SIZES).filter((t) => {
    if (t === source) return false;
    const rt = ratio(t);
    return Math.min(rt / rs, rs / rt) >= 0.55;
  });
}

/** ffmpeg filter: centre-crop to the target ratio, then scale to its standard size. */
export function cropFilter(target: string): string {
  const r = ratio(target);
  const [w, h] = FORMAT_SIZES[target];
  return `crop=w='min(iw,ih*${r.toFixed(6)})':h='min(ih,iw/${r.toFixed(6)})',scale=${w}:${h}:flags=lanczos,setsar=1`;
}
