import "server-only";
import Stripe from "stripe";
import { supabaseAdmin } from "./supabase/server";

export function stripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

/** Returns the user's Stripe customer, creating and saving it the first time. */
export async function customerFor(userId: string, email: string | undefined): Promise<string> {
  const sb = supabaseAdmin();
  const { data: profile } = await sb.from("profiles").select("stripe_customer_id").eq("id", userId).single();
  if (profile?.stripe_customer_id) return profile.stripe_customer_id;
  const customer = await stripe().customers.create({ email, metadata: { user_id: userId } });
  await sb.from("profiles").update({ stripe_customer_id: customer.id }).eq("id", userId);
  return customer.id;
}
