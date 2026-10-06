import { NextResponse } from "next/server";
import { requireUser, supabaseAdmin } from "@/lib/supabase/server";
import { syncGeneration, type GenRow } from "@/lib/jobs";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { user } = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = supabaseAdmin();
  const load = () => admin.from("generations").select().eq("id", id).eq("user_id", user.id).maybeSingle<GenRow>();
  let { data: gen } = await load();
  if (!gen) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (gen.status === "queued" || gen.status === "running") {
    await syncGeneration(gen);
    gen = (await load()).data ?? gen;
  }
  return NextResponse.json({ generation: gen });
}
