/**
 * End-to-end test of the product-ad pipeline with an in-memory database and a fake
 * fal.ai queue, but the REAL montage (ffmpeg). Checks: every step runs once, the
 * final video exists in every format, credits are charged once and refunded once.
 *
 * Run: npm run test:pipeline
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { randomUUID } from "node:crypto";

const FFMPEG = join(process.cwd(), "node_modules/ffmpeg-static/ffmpeg");
const media = mkdtempSync(join(tmpdir(), "takely-media-"));
const storageDir = mkdtempSync(join(tmpdir(), "takely-storage-"));

/* ---------- sample media ---------- */
const ff = (...a: string[]) => execFileSync(FFMPEG, ["-v", "error", "-y", ...a]);
ff("-f", "lavfi", "-i", "color=c=0x2a6f5a:size=1280x720", "-frames:v", "1", join(media, "kf.jpg"));
ff("-f", "lavfi", "-i", "testsrc2=size=720x1280:rate=24", "-t", "5.04", "-pix_fmt", "yuv420p", join(media, "clipA.mp4"));
ff("-f", "lavfi", "-i", "smptebars=size=1080x1920:rate=30", "-t", "5.2", "-pix_fmt", "yuv420p", join(media, "clipB.mp4"));
ff("-f", "lavfi", "-i", "sine=frequency=300:duration=20", "-c:a", "libmp3lame", join(media, "voice.mp3"));
ff("-f", "lavfi", "-i", "sine=frequency=800:duration=40", "-ac", "2", join(media, "music.wav"));

const server = createServer((req, res) => {
  const f = join(media, (req.url ?? "/").slice(1));
  if (!existsSync(f)) return res.writeHead(404).end();
  res.writeHead(200).end(readFileSync(f));
});
await new Promise<void>((r) => server.listen(0, r));
const base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;

/* ---------- in-memory Supabase ---------- */
type Row = Record<string, any>;
const db: Record<string, Row[]> = { profiles: [], credit_ledger: [], ads: [], generations: [] };

class Q {
  private filters: ((r: Row) => boolean)[] = [];
  private op: "select" | "insert" | "update" = "select";
  private payload: Row = {};
  private wantRows = false;
  private countMode = false;
  private mode: "many" | "single" | "maybe" = "many";
  constructor(private table: string) {}
  select(_cols?: string, opts?: { count?: string; head?: boolean }) {
    if (this.op === "select") this.countMode = !!opts?.count;
    this.wantRows = true;
    return this;
  }
  insert(o: Row) { this.op = "insert"; this.payload = o; return this; }
  update(p: Row) { this.op = "update"; this.payload = p; return this; }
  eq(c: string, v: unknown) { this.filters.push((r) => r[c] === v); return this; }
  in(c: string, v: unknown[]) { this.filters.push((r) => v.includes(r[c])); return this; }
  is(c: string, v: unknown) { this.filters.push((r) => (r[c] ?? null) === v); return this; }
  order() { return this; }
  limit() { return this; }
  single() { this.mode = "single"; return this; }
  maybeSingle() { this.mode = "maybe"; return this; }
  then(ok: (v: any) => unknown, ko?: (e: unknown) => unknown) { return Promise.resolve().then(() => this.run()).then(ok, ko); }
  private out(rows: Row[]) {
    const copy = rows.map((r) => structuredClone(r));
    if (this.mode === "many") return { data: copy, error: null };
    if (copy.length === 0) return { data: null, error: this.mode === "single" ? { code: "PGRST116" } : null };
    return { data: copy[0], error: null };
  }
  private run() {
    const rows = db[this.table];
    const now = new Date().toISOString();
    if (this.op === "insert") {
      const r: Row = { id: randomUUID(), created_at: now, updated_at: now, ...this.payload };
      if (this.table === "generations") {
        r.status ??= "queued";
        if (r.ad_id && rows.some((g) => g.ad_id === r.ad_id && g.role === r.role && (g.shot_index ?? -1) === (r.shot_index ?? -1)))
          return { data: null, error: { code: "23505", message: "duplicate" } };
      }
      rows.push(r);
      return this.out([r]);
    }
    const matched = rows.filter((r) => this.filters.every((f) => f(r)));
    if (this.op === "update") {
      matched.forEach((r) => Object.assign(r, structuredClone(this.payload)));
      return this.wantRows ? this.out(matched) : { data: null, error: null };
    }
    if (this.countMode) return { data: null, count: matched.length, error: null };
    return this.out(matched);
  }
}

const fakeAdmin = {
  from: (t: string) => new Q(t),
  async rpc(fn: string, a: { p_user: string; p_amount: number; p_reason: string; p_ref: string }) {
    const p = db.profiles.find((x) => x.id === a.p_user)!;
    if (db.credit_ledger.some((l) => l.ref === a.p_ref)) return { data: false, error: null };
    if (fn === "spend_credits") {
      if (p.credits < a.p_amount) return { data: false, error: null };
      p.credits -= a.p_amount;
      db.credit_ledger.push({ user_id: a.p_user, delta: -a.p_amount, reason: a.p_reason, ref: a.p_ref });
      return { data: true, error: null };
    }
    p.credits += a.p_amount;
    db.credit_ledger.push({ user_id: a.p_user, delta: a.p_amount, reason: a.p_reason, ref: a.p_ref });
    return { data: true, error: null };
  },
  storage: {
    from: (bucket: string) => ({
      async upload(path: string, buf: Buffer) {
        const f = join(storageDir, bucket, path);
        mkdirSync(dirname(f), { recursive: true });
        writeFileSync(f, buf);
        return { data: { path }, error: null };
      },
      getPublicUrl: (path: string) => ({ data: { publicUrl: join(storageDir, bucket, path) } }),
    }),
  },
};
(globalThis as any).__takelyTestAdmin = fakeAdmin;

/* ---------- fake fal.ai queue ---------- */
const failOn = new Set<string>(); // "role:shot" keys that should fail
const submitted: { endpoint: string; input: any }[] = [];
let clipN = 0;
(globalThis as any).__takelyTestFal = {
  async submit(endpoint: string, { input }: { input: any }) {
    submitted.push({ endpoint, input });
    return { request_id: `req-${submitted.length}`, status: "IN_QUEUE" };
  },
  async status() { return { status: "COMPLETED" }; },
  async result(endpoint: string, { requestId }: { requestId: string }) {
    const job = submitted[Number(requestId.split("-")[1]) - 1];
    const g = db.generations.find((x) => x.fal_request_id === requestId);
    if (g && failOn.has(`${g.role}:${g.shot_index ?? ""}`)) throw Object.assign(new Error("boom"), { body: { detail: "model error" } });
    if (endpoint.includes("kontext")) return { data: { images: [{ url: `${base}/kf.jpg` }] }, requestId };
    if (endpoint.includes("kling")) return { data: { video: { url: `${base}/${clipN++ % 2 ? "clipB" : "clipA"}.mp4` } }, requestId };
    if (endpoint.includes("elevenlabs")) return { data: { audio: { url: `${base}/voice.mp3` } }, requestId };
    if (endpoint.includes("music")) return { data: { audio_file: { url: `${base}/music.wav` } }, requestId };
    throw new Error("unexpected endpoint " + endpoint + JSON.stringify(job));
  },
};

const { startAdShoot, advanceAd, syncGeneration, settleGeneration } = await import("../src/lib/jobs.ts");
const { adCost } = await import("../src/lib/models.ts");

/* ---------- helpers ---------- */
function newUser(credits: number) {
  const id = randomUUID();
  db.profiles.push({ id, credits });
  return id;
}
function newAd(userId: string, opts: { duration: number; aspect: string; voiceover?: boolean; music?: boolean }) {
  const shots = opts.duration / 5;
  const ad = {
    id: randomUUID(), user_id: userId, brief: "test", product_image_url: `${base}/kf.jpg`, language: "fr",
    duration: opts.duration, aspect: opts.aspect, voiceover: opts.voiceover ?? true, music: opts.music ?? true,
    status: "shooting", formats: null, final_url: null, thumbnail_url: null, error: null,
    cost: adCost(opts.duration, opts.voiceover ?? true, opts.music ?? true),
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    plan: {
      title: "Test", product_description: "a teal sneaker", locked_elements: ["sneaker"], voiceover: "Une paire. Une ville.",
      music_prompt: "minimal house, 120 BPM",
      shots: Array.from({ length: shots }, (_, i) => ({ title: `Plan ${i + 1}`, description: "", keyframe_prompt: "kf", motion_prompt: "move" })),
    },
  };
  db.ads.push(ad);
  const p = db.profiles.find((x) => x.id === userId)!;
  p.credits -= ad.cost;
  db.credit_ledger.push({ user_id: userId, delta: -ad.cost, reason: "ad", ref: `ad:${ad.id}` });
  return ad;
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Drives the ad like production would: half the jobs report by webhook, half by polling. */
async function drive(adId: string, maxMs = 120_000) {
  const t0 = Date.now();
  let tick = 0;
  while (Date.now() - t0 < maxMs) {
    const ad = db.ads.find((a) => a.id === adId)!;
    if (ad.status === "completed" || ad.status === "failed") return ad;
    const pending = db.generations.filter((g) => g.ad_id === adId && ["queued", "running"].includes(g.status));
    for (const g of pending) {
      if (tick++ % 2) await syncGeneration(structuredClone(g) as any);
      else {
        try {
          const r = await (globalThis as any).__takelyTestFal.result(g.endpoint, { requestId: g.fal_request_id });
          await settleGeneration(g.id, { ok: true, data: r.data });
        } catch (e: any) {
          await settleGeneration(g.id, { ok: false, error: e.body?.detail ?? e.message });
        }
      }
    }
    await advanceAd(adId);
    await advanceAd(adId); // duplicate deliveries must be harmless
    await sleep(200);
  }
  throw new Error("timeout: " + db.ads.find((a) => a.id === adId)!.status);
}
const probe = (f: string) => execFileSync(FFMPEG, ["-i", f], { stdio: ["ignore", "ignore", "pipe"] }).toString();
const info = (f: string) => {
  try { probe(f); } catch (e: any) { return e.stderr.toString() as string; }
  return "";
};

/* ---------- 1. happy path: 15 s, 9:16, voice + music ---------- */
{
  const user = newUser(500);
  const ad = newAd(user, { duration: 15, aspect: "9:16" });
  await startAdShoot(ad as any);
  const done = await drive(ad.id);
  assert.equal(done.status, "completed", done.error ?? "");
  assert.deepEqual(Object.keys(done.formats).sort(), ["1:1", "4:5", "9:16"]);
  const master = info(done.formats["9:16"]);
  assert.match(master, /1080x1920/);
  assert.match(master, /Duration: 00:00:15\.0/);
  assert.match(master, /Audio: aac/);
  assert.match(info(done.formats["4:5"]), /1080x1350/);
  assert.match(info(done.formats["1:1"]), /1080x1080/);
  const gens = db.generations.filter((g) => g.ad_id === ad.id);
  assert.equal(gens.filter((g) => g.role === "keyframe").length, 3);
  assert.equal(gens.filter((g) => g.role === "clip").length, 3);
  assert.equal(gens.filter((g) => g.role === "voice").length, 1);
  assert.equal(gens.filter((g) => g.role === "music").length, 1);
  assert.equal(db.profiles.find((p) => p.id === user)!.credits, 500 - ad.cost, "charged exactly once, no refund");
  console.log("✓ happy path: 15 s ad, 3 formats, voice + music, charged once");
}

/* ---------- 2. a clip fails → ad fails, refunded once ---------- */
{
  const user = newUser(500);
  failOn.add("clip:1");
  const ad = newAd(user, { duration: 15, aspect: "9:16" });
  await startAdShoot(ad as any);
  const done = await drive(ad.id);
  failOn.clear();
  assert.equal(done.status, "failed");
  await advanceAd(ad.id);
  const balance = db.profiles.find((p) => p.id === user)!.credits;
  assert.equal(balance, 500 - 2, "everything but planning refunded, exactly once");
  console.log("✓ failed clip: ad marked failed, refunded once (" + balance + " credits left)");
}

/* ---------- 3. voiceover fails → ad still delivered with music only ---------- */
{
  const user = newUser(500);
  failOn.add("voice:");
  const ad = newAd(user, { duration: 15, aspect: "16:9" });
  await startAdShoot(ad as any);
  const done = await drive(ad.id);
  failOn.clear();
  assert.equal(done.status, "completed", done.error ?? "");
  assert.match(info(done.formats["16:9"]), /1920x1080/);
  assert.deepEqual(Object.keys(done.formats).sort(), ["16:9", "1:1"]);
  console.log("✓ failed voiceover: ad still delivered (16:9 + 1:1)");
}

/* ---------- 4. 30 s ad, no voice, no music ---------- */
{
  const user = newUser(500);
  const ad = newAd(user, { duration: 30, aspect: "4:5", voiceover: false, music: false });
  await startAdShoot(ad as any);
  const done = await drive(ad.id);
  assert.equal(done.status, "completed", done.error ?? "");
  const m = info(done.formats["4:5"]);
  assert.match(m, /1080x1350/);
  assert.match(m, /Duration: 00:00:30\.0/);
  console.log("✓ 30 s silent ad in 4:5 (6 shots)");
}

server.close();
console.log("All pipeline tests passed.");
process.exit(0);
