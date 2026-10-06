import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { PLANS } from "@/lib/billing";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/server";
import { addCredits } from "@/lib/jobs";

/**
 * Stripe events → credits and subscription state. Every credit grant is idempotent
 * (keyed on the Stripe object id), so Stripe retries never double-credit.
 *
 * Events to enable on the webhook: checkout.session.completed, invoice.paid,
 * customer.subscription.created, customer.subscription.updated, customer.subscription.deleted.
 */
export async function POST(req: Request) {
  const s = stripe();
  const sig = req.headers.get("stripe-signature");
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = s.webhooks.constructEvent(raw, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "bad_signature" }, { status: 400 });
  }

  const sb = supabaseAdmin();

  switch (event.type) {
    // One-off credit packs.
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "payment" && session.payment_status === "paid" && session.metadata?.user_id) {
        const credits = parseInt(session.metadata.credits ?? "0", 10);
        await addCredits(sb, session.metadata.user_id, credits, `purchase:${session.metadata.pack}`, `stripe:${session.id}`);
      }
      break;
    }

    // Each paid subscription invoice (first month and every renewal) grants the plan's credits.
    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const meta = invoice.parent?.subscription_details?.metadata;
      const plan = PLANS.find((p) => p.id === meta?.plan);
      if (meta?.user_id && plan) {
        await addCredits(sb, meta.user_id, plan.monthlyCredits, `subscription:${plan.id}`, `stripe-invoice:${invoice.id}`);
      }
      break;
    }

    // Keep the profile's plan in sync (shown in the app, used to route plan changes to the portal).
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.user_id;
      if (!userId) break;
      const ended = event.type === "customer.subscription.deleted" || sub.status === "canceled";
      const periodEnd = sub.items.data[0]?.current_period_end;
      await sb
        .from("profiles")
        .update({
          plan: ended ? null : sub.metadata.plan ?? null,
          plan_status: sub.status,
          stripe_subscription_id: ended ? null : sub.id,
          current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
        })
        .eq("id", userId);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
