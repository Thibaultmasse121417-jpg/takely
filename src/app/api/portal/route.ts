import { NextResponse } from "next/server";
import { appUrl } from "@/lib/fal";
import { customerFor, stripe } from "@/lib/stripe";
import { requireUser } from "@/lib/supabase/server";

/** Stripe customer portal: change plan, update card, download invoices, cancel. */
export async function POST() {
  const { user } = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const customer = await customerFor(user.id, user.email);
  const portal = await stripe().billingPortal.sessions.create({ customer, return_url: `${appUrl()}/app/billing` });
  return NextResponse.json({ url: portal.url });
}
