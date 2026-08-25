import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 px-6 text-center">
      <span className="text-5xl">🇮🇹🚗</span>
      <h1 className="text-4xl font-bold tracking-tight">Patente Facile Italia</h1>
      <p className="max-w-xl text-lg text-slate-600">
        Prepare-se para o exame teórico da carta de motorista na Itália com lições curtas,
        quizzes interativos e progresso gamificado — no estilo Duolingo.
      </p>
      <div className="flex gap-3">
        <Link
          href="/signup"
          className="rounded-full bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700"
        >
          Começar grátis
        </Link>
        <Link
          href="/login"
          className="rounded-full border border-slate-300 px-6 py-3 font-semibold hover:bg-slate-100"
        >
          Já tenho conta
        </Link>
      </div>
    </main>
  );
}
