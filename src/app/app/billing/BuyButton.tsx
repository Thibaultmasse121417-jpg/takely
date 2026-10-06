"use client";
import { useState } from "react";

export function BuyButton({ pack, label, primary }: { pack: string; label: string; primary: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="mt-2 flex flex-col gap-2">
      <button
        type="button"
        disabled={busy}
        className={primary ? "btn-primary" : "btn-ghost"}
        onClick={async () => {
          setBusy(true);
          setError("");
          const r = await fetch("/api/checkout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ pack }) });
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
