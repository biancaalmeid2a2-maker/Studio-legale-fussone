import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import { Quiz } from "@/components/Quiz";
import type { PublicQuestion, UserStats } from "@/lib/types";

export default async function LessonQuizPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, slug, title, module_id, order_index")
    .eq("slug", params.slug)
    .eq("is_published", true)
    .single();

  if (!lesson) notFound();

  const [{ data: questions }, { data: stats }, { data: nextLesson }] = await Promise.all([
    supabase
      .from("questions")
      .select("id, type, prompt, image_url, options, order_index")
      .eq("lesson_id", lesson.id)
      .order("order_index", { ascending: true }),
    supabase.from("user_stats").select("*").eq("user_id", user.id).single(),
    supabase
      .from("lessons")
      .select("slug")
      .eq("module_id", lesson.module_id)
      .eq("is_published", true)
      .gt("order_index", lesson.order_index)
      .order("order_index", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  const userStats = stats as UserStats | null;

  return (
    <>
      <Header
        xpTotal={userStats?.xp_total ?? 0}
        hearts={userStats?.hearts ?? 5}
        streak={userStats?.streak_current ?? 0}
      />
      <main className="mx-auto max-w-2xl px-6 py-8">
        <Quiz
          lessonId={lesson.id}
          lessonSlug={lesson.slug}
          lessonTitle={lesson.title}
          questions={(questions ?? []) as PublicQuestion[]}
          nextLessonSlug={nextLesson?.slug ?? null}
        />
      </main>
    </>
  );
}
