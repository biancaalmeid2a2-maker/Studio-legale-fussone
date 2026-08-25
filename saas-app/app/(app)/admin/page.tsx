import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import type { UserStats } from "@/lib/types";

interface AdminLesson {
  id: string;
  slug: string;
  title: string;
  is_published: boolean;
  order_index: number;
}

interface AdminModule {
  id: string;
  slug: string;
  title: string;
  is_published: boolean;
  order_index: number;
  lessons: AdminLesson[];
}

/**
 * /admin — acessível apenas para profiles.is_admin = true. As políticas de
 * RLS "modules/lessons: admin manage" já garantem que este usuário enxerga
 * também os módulos/lições ainda não publicados (rascunhos).
 */
export default async function AdminPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) redirect("/dashboard");

  const [{ data: modules }, { data: stats }] = await Promise.all([
    supabase
      .from("modules")
      .select(
        "id, slug, title, is_published, order_index, lessons(id, slug, title, is_published, order_index)"
      )
      .order("order_index", { ascending: true })
      .order("order_index", { referencedTable: "lessons", ascending: true }),
    supabase.from("user_stats").select("*").eq("user_id", user.id).single(),
  ]);

  const userStats = stats as UserStats | null;
  const moduleList = (modules ?? []) as AdminModule[];

  return (
    <>
      <Header
        xpTotal={userStats?.xp_total ?? 0}
        hearts={userStats?.hearts ?? 5}
        streak={userStats?.streak_current ?? 0}
      />
      <main className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="text-2xl font-bold">Painel de administração</h1>
        <p className="mt-1 mb-6 text-sm text-slate-500">
          Gestão de conteúdo ainda é manual (via SQL/seed). Esta tela lista módulos e lições
          existentes — a edição por aqui fica para uma próxima etapa; as políticas de RLS de
          admin já estão prontas para isso.
        </p>

        <div className="flex flex-col gap-4">
          {moduleList.map((module) => (
            <div key={module.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-bold">{module.title}</h2>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    module.is_published
                      ? "bg-brand-100 text-brand-800"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {module.is_published ? "Publicado" : "Rascunho"}
                </span>
              </div>

              <ul className="mt-3 flex flex-col gap-1">
                {module.lessons.map((lesson) => (
                  <li key={lesson.id} className="flex items-center justify-between text-sm">
                    <span>{lesson.title}</span>
                    <span className={lesson.is_published ? "text-brand-700" : "text-slate-400"}>
                      {lesson.is_published ? "Publicada" : "Rascunho"}
                    </span>
                  </li>
                ))}
                {module.lessons.length === 0 && (
                  <li className="text-sm text-slate-400">Nenhuma lição cadastrada.</li>
                )}
              </ul>
            </div>
          ))}

          {moduleList.length === 0 && (
            <p className="text-sm text-slate-500">Nenhum módulo cadastrado ainda.</p>
          )}
        </div>
      </main>
    </>
  );
}
