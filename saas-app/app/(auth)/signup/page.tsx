import { Suspense } from "react";
import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";

export default function SignupPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-6 px-6">
      <h1 className="text-2xl font-bold">Criar conta</h1>
      <Suspense>
        <AuthForm mode="signup" />
      </Suspense>
      <p className="text-sm text-slate-600">
        Já tem conta?{" "}
        <Link href="/login" className="font-semibold text-brand-700">
          Entrar
        </Link>
      </p>
    </main>
  );
}
