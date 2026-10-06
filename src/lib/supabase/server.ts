import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/** Supabase client acting as the signed-in user (RLS applies). */
export async function supabaseServer() {
  const store = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          /* called from a Server Component: the middleware refreshes the session instead */
        }
      },
    },
  });
}

/** Service-role client for trusted server work (webhooks, credits). Bypasses RLS. */
export function supabaseAdmin() {
  // Test seam: the pipeline test injects an in-memory database here.
  const injected = (globalThis as { __takelyTestAdmin?: unknown }).__takelyTestAdmin;
  if (injected) return injected as ReturnType<typeof createClient>;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function requireUser() {
  const sb = await supabaseServer();
  const { data } = await sb.auth.getUser();
  return { sb, user: data.user };
}
