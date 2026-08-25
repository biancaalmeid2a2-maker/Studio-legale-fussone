import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import type { Lesson, UserProgress, UserStats } from "@/lib/types";

export default async function ModuleDetailPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: moduleData } = await supabase
    .from("modules")
    .select("id, slug, title, description, icon")
    .eq("slug", params.slug)
    .eq("is_published", true)
    .single();

  if (!moduleData) notFound();

  const [{ data: lessons }, { data: stats }, { data: progress }] = await Promise.all([
    supabase
      .from("lessons")
      .select("id, module_id, slug, title, order_index, xp_reward")
      .eq("module_id", moduleData.id)
      .eq("is_published", true)
      .order("order_index", { ascending: true }),
    supabase.from("user_stats").select("*").eq("user_id", user.id).single(),
    supabase
      .from("user_progress")
      .select("lesson_id, status, score, attempts")
      .eq("user_id", user.id),
  ]);

  const progressByLessonId = new Map(
    ((progress ?? []) as UserProgress[]).map((p) => [p.lesson_id, p])
  );
  const userStats = stats as UserStats | null;

  return (
    <>
      <Header
        xpTotal={userStats?.xp_total ?? 0}
        hearts={userStats?.hearts ?? 5}
        streak={userStats?.streak_current ?? 0}
      />
      <main className="mx-auto max-w-2xl px-6 py-8">
        <Link href="/modules" className="text-sm font-semibold text-brand-700">
          ← Módulos
        </Link>

        <div className="mt-4 flex items-center gap-3">
          <span className="text-4xl" aria-hidden="true">
            {moduleData.icon}
          </span>
          <div>
            <h1 className="text-2xl font-bold">{moduleData.title}</h1>
            {moduleData.description && (
              <p className="text-slate-500">{moduleData.description}</p>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          {((lessons ?? []) as Lesson[]).map((lesson) => {
            const status = progressByLessonId.get(lesson.id)?.status ?? "not_started";
            return (
              <Link
                key={lesson.id}
                href={`/lessons/${lesson.slug}`}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 hover:border-brand-300"
              >
                <span className="font-medium">
                  {status === "completed" && <span aria-hidden="true">✅ </span>}
                  {lesson.title}
                </span>
                <span className="text-sm font-semibold text-brand-700">
                  +{lesson.xp_reward} XP
                </span>
              </Link>
            );
          })}
          {(!lessons || lessons.length === 0) && (
            <p className="text-sm text-slate-500">Nenhuma lição publicada neste módulo ainda.</p>
          )}
        </div>
      </main>
    </>
  );
}
