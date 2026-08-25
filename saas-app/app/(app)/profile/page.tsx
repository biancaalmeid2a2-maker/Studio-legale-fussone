import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import type { ProgressListItem, UserStats } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
  completed: "Concluída",
  in_progress: "Em andamento",
  not_started: "Não iniciada",
};

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-slate-200 bg-white p-4 text-center">
      <span className="text-2xl" aria-hidden="true">
        {icon}
      </span>
      <span className="text-xl font-bold">{value}</span>
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  );
}

export default async function ProfilePage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: stats }, { data: progress }] = await Promise.all([
    supabase.from("profiles").select("full_name, email, is_admin").eq("id", user.id).single(),
    supabase.from("user_stats").select("*").eq("user_id", user.id).single(),
    supabase
      .from("user_progress")
      .select("status, score, attempts, completed_at, lessons(title, slug, xp_reward, modules(title))")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false }),
  ]);

  const userStats = stats as UserStats | null;
  const progressItems = (progress ?? []) as unknown as ProgressListItem[];
  const completedCount = progressItems.filter((p) => p.status === "completed").length;

  return (
    <>
      <Header
        xpTotal={userStats?.xp_total ?? 0}
        hearts={userStats?.hearts ?? 5}
        streak={userStats?.streak_current ?? 0}
      />
      <main className="mx-auto max-w-2xl px-6 py-8">
        <h1 className="text-2xl font-bold">{profile?.full_name || "Meu perfil"}</h1>
        <p className="text-sm text-slate-500">{profile?.email}</p>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="XP total" value={userStats?.xp_total ?? 0} icon="⭐" />
          <StatCard label="Sequência" value={userStats?.streak_current ?? 0} icon="🔥" />
          <StatCard label="Vidas" value={userStats?.hearts ?? 5} icon="❤️" />
          <StatCard label="Lições concluídas" value={completedCount} icon="✅" />
        </div>

        <h2 className="mb-3 mt-8 text-lg font-bold">Progresso por lição</h2>
        <div className="flex flex-col gap-2">
          {progressItems.length === 0 && (
            <p className="text-sm text-slate-500">Você ainda não começou nenhuma lição.</p>
          )}
          {progressItems.map((item, i) => (
            <Link
              key={i}
              href={item.lessons ? `/lessons/${item.lessons.slug}` : "#"}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 hover:border-brand-300"
            >
              <div>
                <p className="font-medium">{item.lessons?.title ?? "Lição removida"}</p>
                {item.lessons?.modules?.title && (
                  <p className="text-xs text-slate-500">{item.lessons.modules.title}</p>
                )}
              </div>
              <div className="text-right text-sm">
                <p className="font-semibold text-slate-700">{STATUS_LABEL[item.status]}</p>
                {item.score !== null && <p className="text-slate-500">{item.score}%</p>}
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 flex items-center gap-3">
          {profile?.is_admin && (
            <Link
              href="/admin"
              className="rounded-full bg-brand-600 px-6 py-2.5 font-semibold text-white hover:bg-brand-700"
            >
              Painel admin
            </Link>
          )}
          <form action="/api/auth/signout" method="post">
            <button
              type="submit"
              className="rounded-full border border-slate-300 px-6 py-2.5 font-semibold text-slate-700 hover:bg-slate-100"
            >
              Sair
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
