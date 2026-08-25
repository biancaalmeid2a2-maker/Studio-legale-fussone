import { Suspense } from "react";
import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-6 px-6">
      <h1 className="text-2xl font-bold">Entrar</h1>
      <Suspense>
        <AuthForm mode="login" />
      </Suspense>
      <p className="text-sm text-slate-600">
        Não tem conta?{" "}
        <Link href="/signup" className="font-semibold text-brand-700">
          Cadastre-se
        </Link>
      </p>
    </main>
  );
}
