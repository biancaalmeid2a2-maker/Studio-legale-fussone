import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import { LessonContent } from "@/components/LessonContent";
import type { Lesson, UserStats } from "@/lib/types";

export default async function LessonPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, module_id, slug, title, content, order_index, xp_reward")
    .eq("slug", params.slug)
    .eq("is_published", true)
    .single();

  if (!lesson) notFound();

  const { data: stats } = await supabase
    .from("user_stats")
    .select("*")
    .eq("user_id", user.id)
    .single();
  const userStats = stats as UserStats | null;

  return (
    <>
      <Header
        xpTotal={userStats?.xp_total ?? 0}
        hearts={userStats?.hearts ?? 5}
        streak={userStats?.streak_current ?? 0}
      />
      <main className="mx-auto max-w-2xl px-6 py-8">
        <LessonContent lesson={lesson as Lesson} />
      </main>
    </>
  );
}
