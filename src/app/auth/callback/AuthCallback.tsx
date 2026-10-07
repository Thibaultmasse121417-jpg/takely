"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { Dict } from "@/lib/i18n";

/**
 * Lands here from the sign-in e-mail. Accepts every link format Supabase can send:
 * tokens in the URL fragment (implicit flow), ?code= (PKCE) or ?token_hash= (custom template).
 */
export function AuthCallback({ t }: { t: Dict["login"] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    const sb = supabaseBrowser();
    const raw = params.get("next") || "/app";
    const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/app";
    const hash = new URLSearchParams(window.location.hash.slice(1));

    (async () => {
      const failed = hash.get("error_description") || params.get("error_description");
      if (failed) throw new Error(failed);

      // The client may already have read the tokens from the URL fragment on start-up.
      let { data } = await sb.auth.getSession();
      if (!data.session) {
        const access_token = hash.get("access_token");
        const refresh_token = hash.get("refresh_token");
        const code = params.get("code");
        const token_hash = params.get("token_hash");
        if (access_token && refresh_token) {
          const r = await sb.auth.setSession({ access_token, refresh_token });
          if (r.error) throw r.error;
        } else if (code) {
          const r = await sb.auth.exchangeCodeForSession(code);
          if (r.error) throw r.error;
        } else if (token_hash) {
          const r = await sb.auth.verifyOtp({ token_hash, type: (params.get("type") as EmailOtpType) || "email" });
          if (r.error) throw r.error;
        }
        ({ data } = await sb.auth.getSession());
      }
      if (!data.session) throw new Error(t.linkInvalid);
      router.replace(next);
      router.refresh();
    })().catch((e: unknown) => setError(e instanceof Error ? e.message : t.linkInvalid));
  }, [params, router, t.linkInvalid]);

  if (!error) return <p className="text-muted">{t.signingIn}</p>;
  return (
    <div className="flex flex-col gap-4">
      <p role="alert" className="text-danger">{error}</p>
      <p className="text-sm text-muted">{t.linkHelp}</p>
      <Link href="/login" className="btn-primary self-start">{t.retry}</Link>
    </div>
  );
}
