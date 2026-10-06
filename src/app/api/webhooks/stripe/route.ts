import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase/server";
import { addCredits } from "@/lib/jobs";

/** Credits the buyer once Stripe confirms the payment. Idempotent on the session id. */
export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const sig = req.headers.get("stripe-signature");
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "bad_signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const s = event.data.object as Stripe.Checkout.Session;
    if (s.payment_status === "paid" && s.metadata?.user_id) {
      const credits = parseInt(s.metadata.credits ?? "0", 10);
      await addCredits(supabaseAdmin(), s.metadata.user_id, credits, `purchase:${s.metadata.pack}`, `stripe:${s.id}`);
    }
  }
  return NextResponse.json({ received: true });
}
