import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Module } from "@/lib/types";

/**
 * Server Component: busca os módulos publicados em `public.modules` e exibe
 * cada um em um card clicável apontando para /modules/[slug].
 */
export async function ModulesGrid() {
  const supabase = createClient();

  const { data: modules, error } = await supabase
    .from("modules")
    .select("id, slug, title, description, icon, order_index")
    .eq("is_published", true)
    .order("order_index", { ascending: true });

  if (error) {
    return (
      <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Não foi possível carregar os módulos: {error.message}
      </p>
    );
  }

  if (!modules || modules.length === 0) {
    return <p className="text-sm text-slate-500">Nenhum módulo disponível no momento.</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {(modules as Module[]).map((module) => (
        <Link
          key={module.id}
          href={`/modules/${module.slug}`}
          className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl" aria-hidden="true">
              {module.icon}
            </span>
            <h3 className="font-bold">{module.title}</h3>
          </div>
          {module.description && (
            <p className="text-sm text-slate-500">{module.description}</p>
          )}
        </Link>
      ))}
    </div>
  );
}
