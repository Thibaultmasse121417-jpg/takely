import { NextResponse } from "next/server";
import { appUrl } from "@/lib/fal";
import { customerFor, portalConfigurationId, stripe } from "@/lib/stripe";
import { requireUser } from "@/lib/supabase/server";

/** Stripe customer portal: change plan, update card, download invoices, cancel. */
export async function POST() {
  const { user } = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const customer = await customerFor(user.id, user.email);
    const portal = await stripe().billingPortal.sessions.create({
      customer,
      return_url: `${appUrl()}/app/billing`,
      configuration: await portalConfigurationId(),
    });
    return NextResponse.json({ url: portal.url });
  } catch (e) {
    console.error("portal", e);
    return NextResponse.json({ error: "payment_unavailable" }, { status: 502 });
  }
}
