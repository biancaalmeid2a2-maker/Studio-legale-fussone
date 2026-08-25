import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import { ModuleCard } from "@/components/ModuleCard";
import type { ModuleWithLessons, UserProgress, UserStats } from "@/lib/types";

export default async function DashboardPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: modules }, { data: stats }, { data: progress }] = await Promise.all([
    supabase
      .from("modules")
      .select(
        "id, slug, title, description, icon, order_index, lessons(id, module_id, slug, title, order_index, xp_reward)"
      )
      .eq("is_published", true)
      .order("order_index", { ascending: true }),
    supabase.from("user_stats").select("*").eq("user_id", user.id).single(),
    supabase.from("user_progress").select("lesson_id, status, score, attempts").eq("user_id", user.id),
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
      <main className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="mb-6 text-2xl font-bold">Seus módulos</h1>
        <div className="grid gap-4 sm:grid-cols-2">
          {((modules ?? []) as ModuleWithLessons[]).map((module) => (
            <ModuleCard key={module.id} module={module} progressByLessonId={progressByLessonId} />
          ))}
        </div>
      </main>
    </>
  );
}
