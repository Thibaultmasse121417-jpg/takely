import { NextResponse } from "next/server";
import { z } from "zod";
import { costFor, endpointFor, getModel } from "@/lib/models";
import { requireUser, supabaseAdmin } from "@/lib/supabase/server";
import { spendCredits, submitGeneration } from "@/lib/jobs";
import { userLimits } from "@/lib/plan";

const Body = z.object({
  model: z.string(),
  prompt: z.string().trim().min(3).max(2000),
  imageUrl: z.string().url().nullish(),
  aspect: z.enum(["9:16", "16:9", "1:1", "4:5"]),
  duration: z.number().int().min(1).max(15).default(5),
});

export async function POST(req: Request) {
  const { user } = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  const form = parsed.data;

  const model = getModel(form.model);
  if (!model) return NextResponse.json({ error: "unknown_model" }, { status: 400 });
  if (model.requiresImage && !form.imageUrl) return NextResponse.json({ error: "image_required" }, { status: 400 });
  const aspect = model.aspects.includes(form.aspect) ? form.aspect : model.aspects[0];
  const duration = model.durations ? model.durations.reduce((a, b) => (Math.abs(b - form.duration) < Math.abs(a - form.duration) ? b : a)) : form.duration;

  const cost = costFor(model, { duration });
  const admin = supabaseAdmin();

  // Generations running at once depend on the plan.
  const limits = await userLimits(user.id);
  const { count } = await admin
    .from("generations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("ad_id", null)
    .in("status", ["queued", "running"]);
  if ((count ?? 0) >= limits.parallelGens) return NextResponse.json({ error: "too_many_running" }, { status: 429 });

  const ref = `gen:${crypto.randomUUID()}`;
  if (!(await spendCredits(admin, user.id, cost, `generate:${model.id}`, ref))) {
    return NextResponse.json({ error: "not_enough_credits" }, { status: 402 });
  }

  const input = model.buildInput({ ...form, aspect, duration });
  const gen = await submitGeneration({
    userId: user.id,
    kind: model.kind,
    model: model.id,
    endpoint: endpointFor(model, form),
    input,
    prompt: form.prompt,
    aspect,
    cost,
  });
  return NextResponse.json({ generation: gen });
}
