import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import type { UserStats } from "@/lib/types";

interface LeaderboardEntry {
  user_id: string;
  full_name: string | null;
  xp_total: number;
}

export default async function LeaderboardPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: leaderboard, error }, { data: stats }] = await Promise.all([
    supabase
      .from("leaderboard")
      .select("user_id, full_name, xp_total")
      .order("xp_total", { ascending: false })
      .limit(10),
    supabase.from("user_stats").select("*").eq("user_id", user.id).single(),
  ]);

  const userStats = stats as UserStats | null;
  const entries = (leaderboard ?? []) as LeaderboardEntry[];

  return (
    <>
      <Header
        xpTotal={userStats?.xp_total ?? 0}
        hearts={userStats?.hearts ?? 5}
        streak={userStats?.streak_current ?? 0}
      />
      <main className="mx-auto max-w-2xl px-6 py-8">
        <h1 className="mb-6 text-2xl font-bold">🏆 Ranking de XP</h1>

        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Não foi possível carregar o ranking: {error.message}
          </p>
        )}

        {!error && entries.length === 0 && (
          <p className="text-sm text-slate-500">Ainda não há dados suficientes para o ranking.</p>
        )}

        <ol className="flex flex-col gap-2">
          {entries.map((entry, i) => {
            const isMe = entry.user_id === user.id;
            return (
              <li
                key={entry.user_id}
                className={`flex items-center justify-between rounded-xl border p-4 ${
                  isMe ? "border-brand-400 bg-brand-50" : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 text-center font-bold text-slate-500">{i + 1}º</span>
                  <span className="font-medium">
                    {entry.full_name || "Usuário"}
                    {isMe && <span className="ml-2 text-xs text-brand-700">(você)</span>}
                  </span>
                </div>
                <span className="font-semibold text-brand-700">{entry.xp_total} XP</span>
              </li>
            );
          })}
        </ol>
      </main>
    </>
  );
}
