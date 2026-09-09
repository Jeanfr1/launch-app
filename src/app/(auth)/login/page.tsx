import { Suspense } from "react";
import { RocketIcon } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-background p-4">
      {/* Glow de marca ao fundo */}
      <div className="pointer-events-none absolute -top-48 left-1/2 size-[560px] -translate-x-1/2 rounded-full bg-primary/20 blur-[130px]" />
      <div className="pointer-events-none absolute -bottom-48 right-0 size-[420px] rounded-full bg-[#14b8a6]/10 blur-[130px]" />

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-6">
        <div className="flex items-center gap-2.5">
          <div className="brand-gradient flex size-10 items-center justify-center rounded-xl shadow-lg shadow-primary/30">
            <RocketIcon className="size-6 text-white" />
          </div>
          <span className="text-xl font-semibold">launchapp</span>
        </div>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
