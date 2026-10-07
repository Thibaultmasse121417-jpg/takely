"use client";
import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/env";

/**
 * Browser client. Uses the "implicit" flow so the sign-in link e-mailed to the user
 * works in whatever browser opens it (iPhone Mail / Gmail often open links in a
 * different browser than the one that asked for the e-mail, which breaks PKCE links).
 */
export function supabaseBrowser() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { flowType: "implicit", detectSessionInUrl: true },
  });
}
