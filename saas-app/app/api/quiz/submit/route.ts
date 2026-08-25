import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { QuizAnswerInput, QuizResultItem, QuizSubmitResult } from "@/lib/types";

const PASSING_SCORE_PERCENT = 80;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * POST /api/quiz/submit
 * body: { lessonId: string, answers: QuizAnswerInput[] }
 *
 * Fecha o quiz: recalcula o score no servidor (o cliente já recebeu feedback
 * por pergunta via /api/quiz/answer, que também gravou cada `user_answers` e
 * incrementou `attempts` — aqui não repetimos essa gravação). Atualiza
 * `user_progress` (status/score/completed_at) e `user_stats` (XP + streak).
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

  const { error: progressError } = await supabase.from("user_progress").upsert(
    {
      user_id: user.id,
      lesson_id: lessonId,
      status: passed ? "completed" : "in_progress",
      score,
      completed_at: passed ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,lesson_id" }
  );

  if (progressError) {
    return NextResponse.json({ error: progressError.message }, { status: 500 });
  }

  const { data: stats } = await supabase
    .from("user_stats")
    .select("xp_total, streak_current, streak_longest, last_activity_date")
    .eq("user_id", user.id)
    .single();

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - ONE_DAY_MS).toISOString().slice(0, 10);

  let nextStreak = stats?.streak_current ?? 0;
  if (stats?.last_activity_date !== today) {
    nextStreak = stats?.last_activity_date === yesterday ? nextStreak + 1 : 1;
  }

  const { error: statsError } = await supabase
    .from("user_stats")
    .update({
      xp_total: (stats?.xp_total ?? 0) + xpAwarded,
      streak_current: nextStreak,
      streak_longest: Math.max(stats?.streak_longest ?? 0, nextStreak),
      last_activity_date: today,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (statsError) {
    return NextResponse.json({ error: statsError.message }, { status: 500 });
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
