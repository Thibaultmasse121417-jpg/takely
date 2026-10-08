"use client";
import { useEffect } from "react";

/**
 * If Supabase sends the sign-in link to a page other than /auth/callback (for example
 * the home page, when the callback URL isn't in the allow list), forward the tokens there.
 */
export function AuthLinkForwarder() {
  useEffect(() => {
    const { pathname, search, hash } = window.location;
    if (pathname.startsWith("/auth/callback")) return;
    const q = new URLSearchParams(search);
    const hasAuth = /(^|[#&])(access_token|error_description)=/.test(hash) || q.has("token_hash") || (q.has("code") && pathname === "/");
    if (hasAuth) window.location.replace(`/auth/callback${search}${hash}`);
  }, []);
  return null;
}
