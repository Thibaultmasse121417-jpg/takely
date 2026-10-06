"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { Dict } from "@/lib/i18n";

export function LoginForm({ t }: { t: Dict["login"] }) {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    const next = params.get("next") || "/app";
    const { error } = await supabaseBrowser().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) {
      setError(error.message);
      setState("error");
    } else setState("sent");
  }

  if (state === "sent") return <p className="text-muted">{t.sent}</p>;

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <label htmlFor="email" className="text-sm text-muted">{t.email}</label>
      <input
        id="email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="h-12 rounded-xl border border-line bg-panel px-4 text-text outline-none focus:border-faint"
      />
      <button type="submit" disabled={state === "sending"} className="btn-primary mt-2">{t.send}</button>
      {state === "error" && <p role="alert" className="text-sm text-danger">{error}</p>}
    </form>
  );
}
