import Link from "next/link";

export function LogoMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="6" height="14" rx="1" />
      <rect x="10" y="5" width="5" height="14" rx="1" />
      <rect x="16" y="5" width="5" height="14" rx="1" />
    </svg>
  );
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 text-[18px] font-semibold tracking-[-0.02em] text-text">
      <LogoMark />
      takely
    </Link>
  );
}
