import "server-only";
import { cookies, headers } from "next/headers";
import { getDict, pickLocale, type Locale } from "./i18n";

export async function getLocale(): Promise<Locale> {
  const c = await cookies();
  const h = await headers();
  return pickLocale(c.get("locale")?.value, h.get("accept-language"));
}

export async function getServerDict() {
  const locale = await getLocale();
  return { locale, t: getDict(locale) };
}
