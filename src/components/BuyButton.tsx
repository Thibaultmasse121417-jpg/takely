"use client";
import { useState } from "react";

/** Posts to a billing endpoint and follows the Stripe URL it returns. */
export function BuyButton({
  endpoint = "/api/checkout",
  payload,
  label,
  primary,
}: {
  endpoint?: string;
  payload?: Record<string, string>;
  label: string;
  primary: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={busy}
        className={`w-full ${primary ? "btn-white" : "btn-ghost"}`}
        onClick={async () => {
          setBusy(true);
          setError("");
          const r = await fetch(endpoint, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(payload ?? {}),
          });
          const j = await r.json().catch(() => ({}));
          if (r.ok && j.url) window.location.href = j.url;
          else {
            setError(j.error ?? "Error");
            setBusy(false);
          }
        }}
      >
        {busy ? "…" : label}
      </button>
      {error && <span role="alert" className="text-xs text-danger">{error}</span>}
    </div>
  );
}
