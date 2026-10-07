import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { packByLookupKey, PACKS, planByLookupKey } from "@/lib/billing";
import { lookupKeyForPrice, stripe, userForCustomer, webhookSecret } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/server";
import { addCredits } from "@/lib/jobs";

/**
 * Stripe events → credits and subscription state. Signatures are verified before
 * anything else, and every credit grant is keyed on the Stripe object id, so retries
 * never double-credit. Any processing error returns 500 so Stripe retries the event.
 *
 * Events to send to this endpoint:
 *   checkout.session.completed, checkout.session.async_payment_succeeded,
 *   checkout.session.async_payment_failed, invoice.paid, invoice.payment_failed,
 *   customer.subscription.created, customer.subscription.updated, customer.subscription.deleted
 */
export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const raw = await req.text();

  const secret = await webhookSecret();
  if (!secret) return NextResponse.json({ error: "webhook_not_configured" }, { status: 500 });

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(raw, sig ?? "", secret);
  } catch {
    return NextResponse.json({ error: "bad_signature" }, { status: 400 });
  }

  try {
    await handle(event);
  } catch (e) {
    console.error("stripe webhook", event.type, event.id, e);
    return NextResponse.json({ error: "processing_failed" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}

const idOf = (x: string | { id: string } | null | undefined) => (typeof x === "string" ? x : x?.id ?? null);

async function handle(event: Stripe.Event) {
  const sb = supabaseAdmin();

  switch (event.type) {
    // One-off credit packs. Fulfil only once the money is in (async methods pay later).
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== "payment" || session.payment_status === "unpaid") return;
      const userId = session.metadata?.user_id ?? session.client_reference_id ?? (await userForCustomer(idOf(session.customer)));
      if (!userId) throw new Error(`no user for session ${session.id}`);
      const items = await stripe().checkout.sessions.listLineItems(session.id, { limit: 10 });
      let credits = 0;
      for (const li of items.data) {
        const pack = packByLookupKey(await lookupKeyForPrice(li.price?.id)) ?? PACKS.find((p) => p.id === session.metadata?.pack);
        if (pack) credits += pack.credits * (li.quantity ?? 1);
      }
      if (credits > 0) await addCredits(sb, userId, credits, "purchase:pack", `stripe:${session.id}`);
      return;
    }

    case "checkout.session.async_payment_failed": {
      const session = event.data.object as Stripe.Checkout.Session;
      console.warn("async payment failed", session.id);
      return;
    }

    // Every paid subscription invoice (first month and each renewal) grants that plan's credits.
    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const subDetails = invoice.parent?.subscription_details;
      if (!subDetails) return; // not a subscription invoice
      const userId = subDetails.metadata?.user_id ?? (await userForCustomer(idOf(invoice.customer)));
      if (!userId) throw new Error(`no user for invoice ${invoice.id}`);
      let credits = 0;
      let planId: string | null = null;
      for (const line of invoice.lines.data) {
        const plan = planByLookupKey(await lookupKeyForPrice(idOf(line.pricing?.price_details?.price)));
        if (plan && line.amount >= 0) {
          credits += plan.monthlyCredits * (line.quantity ?? 1);
          planId = plan.id;
        }
      }
      if (credits > 0) await addCredits(sb, userId, credits, `subscription:${planId}`, `stripe-invoice:${invoice.id}`);
      return;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      if (!invoice.parent?.subscription_details) return;
      const userId = invoice.parent.subscription_details.metadata?.user_id ?? (await userForCustomer(idOf(invoice.customer)));
      if (userId) await sb.from("profiles").update({ plan_status: "past_due" }).eq("id", userId);
      return;
    }

    // Keep the profile's plan in sync (also covers plan changes made in the customer portal).
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.user_id ?? (await userForCustomer(idOf(sub.customer)));
      if (!userId) throw new Error(`no user for subscription ${sub.id}`);
      const item = sub.items.data[0];
      const plan = planByLookupKey(item?.price?.lookup_key ?? (await lookupKeyForPrice(item?.price?.id)));
      const ended = event.type === "customer.subscription.deleted" || sub.status === "canceled";
      await sb
        .from("profiles")
        .update({
          plan: ended ? null : plan?.id ?? null,
          plan_status: sub.status,
          stripe_subscription_id: ended ? null : sub.id,
          current_period_end: item?.current_period_end ? new Date(item.current_period_end * 1000).toISOString() : null,
        })
        .eq("id", userId);
      return;
    }
  }
}
