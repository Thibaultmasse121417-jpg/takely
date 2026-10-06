import { Suspense } from "react";
import { Logo } from "@/components/Logo";
import { getServerDict } from "@/lib/locale";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const { t } = await getServerDict();
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <Logo />
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-[-0.03em]">{t.login.title}</h1>
          <p className="text-muted">{t.login.sub}</p>
        </div>
        <Suspense>
          <LoginForm t={t.login} />
        </Suspense>
      </div>
    </main>
  );
}
