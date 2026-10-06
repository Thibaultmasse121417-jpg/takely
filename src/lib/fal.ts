import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { fal } from "@fal-ai/client";

fal.config({ credentials: process.env.FAL_KEY });

export { fal };

type Queue = Pick<typeof fal.queue, "submit" | "status" | "result">;
/** fal's job queue (the pipeline test injects a fake one). */
export function falQueue(): Queue {
  return (globalThis as { __takelyTestFal?: Queue }).__takelyTestFal ?? fal.queue;
}

const secret = () => process.env.WEBHOOK_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "dev";

/** Signs a generation id so the fal webhook can't be spoofed by anyone who guesses ids. */
export function signGeneration(id: string): string {
  return createHmac("sha256", secret()).update(id).digest("hex").slice(0, 32);
}

export function verifyGeneration(id: string, token: string | null): boolean {
  if (!token) return false;
  const a = Buffer.from(signGeneration(id));
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

/** Webhooks only work when fal can reach us (deployed). Locally we fall back to polling. */
export function webhookUrlFor(generationId: string): string | undefined {
  const base = appUrl();
  if (base.includes("localhost") || base.includes("127.0.0.1")) return undefined;
  return `${base}/api/webhooks/fal?gid=${generationId}&t=${signGeneration(generationId)}`;
}
