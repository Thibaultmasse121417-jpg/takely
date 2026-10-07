import "server-only";
import { PLAN_LIMITS, type PlanId } from "./billing";
import { supabaseAdmin } from "./supabase/server";

/** The plan a user is entitled to right now ("free" without an active subscription). */
export async function userPlan(userId: string): Promise<PlanId | "free"> {
  const { data } = await supabaseAdmin().from("profiles").select("plan, plan_status").eq("id", userId).maybeSingle();
  const active = data?.plan_status === "active" || data?.plan_status === "trialing" || data?.plan_status === "past_due";
  return active && data?.plan && data.plan in PLAN_LIMITS ? (data.plan as PlanId) : "free";
}

export async function userLimits(userId: string) {
  return PLAN_LIMITS[await userPlan(userId)];
}
