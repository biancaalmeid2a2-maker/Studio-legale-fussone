import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { PublicQuestion } from "@/lib/types";

/** GET /api/lessons/[slug] — detalhe da lição + perguntas SEM o gabarito. */
export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select("id, module_id, slug, title, content, order_index, xp_reward")
    .eq("slug", params.slug)
    .eq("is_published", true)
    .single();

  if (lessonError || !lesson) {
    return NextResponse.json({ error: "Lição não encontrada" }, { status: 404 });
  }

  const { data: questions, error: questionsError } = await supabase
    .from("questions")
    .select("id, type, prompt, image_url, options, order_index")
    .eq("lesson_id", lesson.id)
    .order("order_index", { ascending: true });

  if (questionsError) {
    return NextResponse.json({ error: questionsError.message }, { status: 500 });
  }

  return NextResponse.json({ lesson, questions: questions as PublicQuestion[] });
}
