import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { PACKS, PLANS, lookupKey } from "@/lib/billing";
import { appUrl } from "@/lib/fal";
import { INTEGRATION_ID, automaticTax, customerFor, ensureStripeReady, portalConfigurationId, priceIdFor, stripe } from "@/lib/stripe";
import { requireUser, supabaseAdmin } from "@/lib/supabase/server";

/**
 * Starts a Stripe Checkout Session for a monthly plan ({ plan }) or a one-off credit
 * pack ({ pack }). Credits are granted by the webhook, never by the success page.
 * Payment methods are not listed here: Stripe picks them from the Dashboard settings.
 */
export async function POST(req: Request) {
  const { user } = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { plan?: string; pack?: string; interval?: string };
  const interval = body.interval === "year" ? "year" : "month";
  const plan = body.plan ? PLANS.find((p) => p.id === body.plan) : undefined;
  const pack = body.pack ? PACKS.find((p) => p.id === body.pack) : undefined;
  if (!plan && !pack) return NextResponse.json({ error: "unknown_product" }, { status: 400 });

  try {
    await ensureStripeReady();
    const s = stripe();
    const customer = await customerFor(user.id, user.email);
    const back = `${appUrl()}/app/billing`;

    // Already subscribed: plan changes, card and cancellation live in the customer portal.
    if (plan) {
      const { data: profile } = await supabaseAdmin().from("profiles").select("plan_status").eq("id", user.id).single();
      if (profile?.plan_status === "active" || profile?.plan_status === "past_due" || profile?.plan_status === "trialing") {
        const portal = await s.billingPortal.sessions.create({
          customer,
          return_url: back,
          configuration: await portalConfigurationId(),
        });
        return NextResponse.json({ url: portal.url });
      }
    }

    const tax: Partial<Stripe.Checkout.SessionCreateParams> = automaticTax()
      ? { automatic_tax: { enabled: true }, billing_address_collection: "required", customer_update: { address: "auto", name: "auto" }, tax_id_collection: { enabled: true } }
      : {};

    const session = await s.checkout.sessions.create({
      mode: plan ? "subscription" : "payment",
      customer,
      client_reference_id: user.id,
      line_items: [{ price: await priceIdFor(plan ? lookupKey(plan.id, interval) : pack!.lookupKey), quantity: 1 }],
      ...(plan
        ? { subscription_data: { metadata: { user_id: user.id } } }
        : { metadata: { user_id: user.id, pack: pack!.id }, invoice_creation: { enabled: true } }),
      allow_promotion_codes: true,
      integration_identifier: INTEGRATION_ID,
      success_url: `${back}?success=1`,
      cancel_url: back,
      ...tax,
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("checkout", e);
    return NextResponse.json({ error: "payment_unavailable" }, { status: 502 });
  }
}
