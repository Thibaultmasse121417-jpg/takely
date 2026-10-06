import { NextResponse } from "next/server";
import Stripe from "stripe";
import { CURRENCY, PACKS } from "@/lib/billing";
import { appUrl } from "@/lib/fal";
import { requireUser } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const { user } = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { pack: packId } = (await req.json().catch(() => ({}))) as { pack?: string };
  const pack = PACKS.find((p) => p.id === packId);
  if (!pack) return NextResponse.json({ error: "unknown_pack" }, { status: 400 });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: user.email ?? undefined,
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
    success_url: `${appUrl()}/app/billing?success=1`,
    cancel_url: `${appUrl()}/app/billing`,
  });
  return NextResponse.json({ url: session.url });
}
