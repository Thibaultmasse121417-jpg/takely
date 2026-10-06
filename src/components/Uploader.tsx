"use client";
import { useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export function Uploader({
  value,
  onChange,
  label,
  uploadingLabel,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  label: string;
  uploadingLabel: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function upload(file: File) {
    setBusy(true);
    setError("");
    try {
      const sb = supabaseBrowser();
      const { data: auth } = await sb.auth.getUser();
      if (!auth.user) throw new Error("Not signed in");
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
      const path = `${auth.user.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await sb.storage.from("uploads").upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      onChange(sb.storage.from("uploads").getPublicUrl(path).data.publicUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2.5">
      {value && (
        <div className="relative h-[84px] w-[84px] overflow-hidden rounded-xl border border-[#333338] bg-[#222226]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label="Remove image"
            className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink/80 text-xs text-text"
          >
            ×
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={busy}
        aria-label={label}
        title={label}
        className="flex h-[84px] min-w-[84px] items-center justify-center gap-2 rounded-xl border border-dashed border-[#3a3a40] px-3 text-[13px] text-muted hover:border-faint hover:text-text"
      >
        {busy ? (
          uploadingLabel
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
            {!value && <span className="hidden sm:inline">{label}</span>}
          </>
        )}
      </button>
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
          e.target.value = "";
        }}
      />
      {error && <span role="alert" className="text-xs text-danger">{error}</span>}
    </div>
  );
}
