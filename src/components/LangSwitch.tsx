"use client";
import { useRouter } from "next/navigation";
import { LOCALES, type Locale } from "@/lib/i18n";

export function LangSwitch({ locale }: { locale: Locale }) {
  const router = useRouter();
  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">Language</span>
      <select
        value={locale}
        onChange={(e) => {
          document.cookie = `locale=${e.target.value}; path=/; max-age=31536000; samesite=lax`;
          router.refresh();
        }}
        className="h-11 cursor-pointer appearance-none rounded-full border border-line bg-transparent px-4 font-mono text-xs uppercase text-muted outline-none hover:border-faint"
      >
        {LOCALES.map((l) => (
          <option key={l} value={l} className="bg-panel">
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}
