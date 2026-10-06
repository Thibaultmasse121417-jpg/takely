import { NextResponse } from "next/server";
import { verifyGeneration } from "@/lib/fal";
import { settleGeneration } from "@/lib/jobs";

export const maxDuration = 60;

/** fal.ai calls this when a queued job finishes. */
export async function POST(req: Request) {
  const url = new URL(req.url);
  const gid = url.searchParams.get("gid");
  if (!gid || !verifyGeneration(gid, url.searchParams.get("t"))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as
    | { status?: string; payload?: unknown; error?: string; payload_error?: string }
    | null;
  if (!body) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  if (body.status === "OK" && body.payload) {
    await settleGeneration(gid, { ok: true, data: body.payload });
  } else {
    const detail = (body.payload as { detail?: unknown } | undefined)?.detail;
    const msg = body.error || body.payload_error || (detail ? JSON.stringify(detail) : "Generation failed");
    await settleGeneration(gid, { ok: false, error: String(msg).slice(0, 500) });
  }
  return NextResponse.json({ ok: true });
}
