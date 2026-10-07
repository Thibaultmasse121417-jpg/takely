/**
 * Supabase settings under either naming scheme (legacy anon/service_role keys or the
 * newer publishable/secret keys the Vercel integration may create). Each NEXT_PUBLIC_
 * name is written out in full so Next.js can inline it in the browser bundle.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
/** Server only. */
export const supabaseServiceKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "";
