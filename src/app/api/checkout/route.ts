import { NextResponse } from "next/server";
import { CURRENCY, PACKS, PLANS } from "@/lib/billing";
import { appUrl } from "@/lib/fal";
import { customerFor, stripe } from "@/lib/stripe";
import { requireUser, supabaseAdmin } from "@/lib/supabase/server";

/** Starts a Stripe Checkout for a monthly plan ({ plan }) or a one-off credit pack ({ pack }). */
export async function POST(req: Request) {
  const { user } = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { plan?: string; pack?: string };
  const customer = await customerFor(user.id, user.email);
  const s = stripe();
  const back = `${appUrl()}/app/billing`;

  if (body.plan) {
    const plan = PLANS.find((p) => p.id === body.plan);
    if (!plan) return NextResponse.json({ error: "unknown_plan" }, { status: 400 });

    // Already subscribed: plan changes and cancellation happen in the Stripe portal.
    const { data: profile } = await supabaseAdmin().from("profiles").select("plan_status").eq("id", user.id).single();
    if (profile?.plan_status === "active" || profile?.plan_status === "past_due") {
      const portal = await s.billingPortal.sessions.create({ customer, return_url: back });
      return NextResponse.json({ url: portal.url });
    }

    const session = await s.checkout.sessions.create({
      mode: "subscription",
      customer,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: CURRENCY,
            unit_amount: plan.priceCents,
            recurring: { interval: "month" },
            product_data: { name: `Takely ${plan.name} — ${plan.monthlyCredits} credits / month` },
          },
        },
      ],
      subscription_data: { metadata: { user_id: user.id, plan: plan.id } },
      allow_promotion_codes: true,
      success_url: `${back}?success=1`,
      cancel_url: back,
    });
    return NextResponse.json({ url: session.url });
  }

  const pack = PACKS.find((p) => p.id === body.pack);
  if (!pack) return NextResponse.json({ error: "unknown_pack" }, { status: 400 });
  const session = await s.checkout.sessions.create({
    mode: "payment",
    customer,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: CURRENCY,
          unit_amount: pack.priceCents,
          product_data: { name: `Takely — ${pack.credits} credits` },
        },
      },
    ],
    metadata: { user_id: user.id, credits: String(pack.credits), pack: pack.id },
    success_url: `${back}?success=1`,
    cancel_url: back,
  });
  return NextResponse.json({ url: session.url });
}
