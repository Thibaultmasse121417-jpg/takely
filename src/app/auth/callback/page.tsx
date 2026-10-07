import { Suspense } from "react";
import { Logo } from "@/components/Logo";
import { getServerDict } from "@/lib/locale";
import { AuthCallback } from "./AuthCallback";

export default async function AuthCallbackPage() {
  const { t } = await getServerDict();
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <Logo />
        <Suspense>
          <AuthCallback t={t.login} />
        </Suspense>
      </div>
    </main>
  );
}
