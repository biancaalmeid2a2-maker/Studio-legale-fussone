import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** GET /api/progress — stats (XP, streak, vidas) + progresso por lição do usuário logado. */
export async function GET() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const [{ data: stats, error: statsError }, { data: progress, error: progressError }] =
    await Promise.all([
      supabase.from("user_stats").select("*").eq("user_id", user.id).single(),
      supabase
        .from("user_progress")
        .select("lesson_id, status, score, attempts")
        .eq("user_id", user.id),
    ]);

  if (statsError || progressError) {
    return NextResponse.json(
      { error: statsError?.message ?? progressError?.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ stats, progress });
}
