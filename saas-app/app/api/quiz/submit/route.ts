import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { QuizAnswerInput, QuizResultItem, QuizSubmitResult } from "@/lib/types";

const PASSING_SCORE_PERCENT = 80;

/**
 * POST /api/quiz/submit
 * body: { lessonId: string, answers: QuizAnswerInput[] }
 *
 * Corrige as respostas no servidor (o cliente nunca recebe o gabarito),
 * grava o histórico, atualiza o progresso da lição e credita XP quando aprovado.
 */
export async function POST(request: Request) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = (await request.json()) as { lessonId?: string; answers?: QuizAnswerInput[] };
  const { lessonId, answers } = body;

  if (!lessonId || !Array.isArray(answers) || answers.length === 0) {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select("id, xp_reward")
    .eq("id", lessonId)
    .single();

  if (lessonError || !lesson) {
    return NextResponse.json({ error: "Lição não encontrada" }, { status: 404 });
  }

  const questionIds = answers.map((a) => a.questionId);
  const { data: questions, error: questionsError } = await supabase
    .from("questions")
    .select("id, correct_option_id, explanation")
    .in("id", questionIds);

  if (questionsError || !questions) {
    return NextResponse.json({ error: "Erro ao carregar perguntas" }, { status: 500 });
  }

  const correctById = new Map(questions.map((q) => [q.id, q]));

  const results: QuizResultItem[] = answers.map((answer) => {
    const question = correctById.get(answer.questionId);
    const correct = !!question && question.correct_option_id === answer.selectedOptionId;
    return {
      questionId: answer.questionId,
      correct,
      correctOptionId: question?.correct_option_id ?? "",
      explanation: question?.explanation ?? null,
    };
  });

  const correctCount = results.filter((r) => r.correct).length;
  const score = Math.round((correctCount / results.length) * 100);
  const passed = score >= PASSING_SCORE_PERCENT;
  const xpAwarded = passed ? lesson.xp_reward : 0;

  const answerRows = answers.map((answer) => ({
    user_id: user.id,
    question_id: answer.questionId,
    lesson_id: lessonId,
    selected_option_id: answer.selectedOptionId,
    is_correct: correctById.get(answer.questionId)?.correct_option_id === answer.selectedOptionId,
  }));

  const { error: insertError } = await supabase.from("user_answers").insert(answerRows);
  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const { data: existingProgress } = await supabase
    .from("user_progress")
    .select("attempts")
    .eq("user_id", user.id)
    .eq("lesson_id", lessonId)
    .maybeSingle();

  const { error: progressError } = await supabase.from("user_progress").upsert(
    {
      user_id: user.id,
      lesson_id: lessonId,
      status: passed ? "completed" : "in_progress",
      score,
      attempts: (existingProgress?.attempts ?? 0) + 1,
      completed_at: passed ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,lesson_id" }
  );

  if (progressError) {
    return NextResponse.json({ error: progressError.message }, { status: 500 });
  }

  if (xpAwarded > 0) {
    const { data: stats } = await supabase
      .from("user_stats")
      .select("xp_total")
      .eq("user_id", user.id)
      .single();

    await supabase
      .from("user_stats")
      .update({
        xp_total: (stats?.xp_total ?? 0) + xpAwarded,
        last_activity_date: new Date().toISOString().slice(0, 10),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);
  }

  const response: QuizSubmitResult = {
    score,
    totalQuestions: results.length,
    passed,
    xpAwarded,
    results,
  };

  return NextResponse.json(response);
}
