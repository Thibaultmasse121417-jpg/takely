/**
 * Creates (or updates) Takely's Stripe catalogue and customer-portal settings.
 * The app also does this by itself on its first checkout; this script is for doing it
 * ahead of time (e.g. with the live key before launch). Safe to run several times.
 *
 *   STRIPE_SECRET_KEY=sk_test_… NEXT_PUBLIC_APP_URL=https://… npm run stripe:setup
 */
import Stripe from "stripe";
import { ensureCatalog } from "../src/lib/stripe-catalog.ts";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("Set STRIPE_SECRET_KEY first.");
  process.exit(1);
}
const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
await ensureCatalog(new Stripe(key), appUrl, console.log);
console.log("\nStripe catalogue ready.");
