import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/quiz/answer — body: { lessonId, questionId, selectedOptionId }
 *
 * Chamado a cada resposta dentro do quiz (não só ao final):
 * 1. Compara `selected_option_id` com o gabarito no servidor (o cliente
 *    nunca recebe `correct_option_id` antes de responder).
 * 2. Grava uma linha em `user_answers` (histórico completo de respostas).
 * 3. Incrementa `attempts` em `user_progress`, garantindo que a lição
 *    exista como pelo menos "in_progress" (nunca rebaixa uma já 'completed').
 * 4. Retorna `is_correct` + `explanation` para o feedback instantâneo na tela.
 */
export async function POST(request: Request) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { lessonId, questionId, selectedOptionId } = (await request.json()) as {
    lessonId?: string;
    questionId?: string;
    selectedOptionId?: string;
  };

  if (!lessonId || !questionId || !selectedOptionId) {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const { data: question, error: questionError } = await supabase
    .from("questions")
    .select("correct_option_id, explanation")
    .eq("id", questionId)
    .single();

  if (questionError || !question) {
    return NextResponse.json({ error: "Pergunta não encontrada" }, { status: 404 });
  }

  const isCorrect = question.correct_option_id === selectedOptionId;

  const { error: answerError } = await supabase.from("user_answers").insert({
    user_id: user.id,
    question_id: questionId,
    lesson_id: lessonId,
    selected_option_id: selectedOptionId,
    is_correct: isCorrect,
  });

  if (answerError) {
    return NextResponse.json({ error: answerError.message }, { status: 500 });
  }

  const { data: existingProgress } = await supabase
    .from("user_progress")
    .select("status, attempts")
    .eq("user_id", user.id)
    .eq("lesson_id", lessonId)
    .maybeSingle();

  const { error: progressError } = await supabase.from("user_progress").upsert(
    {
      user_id: user.id,
      lesson_id: lessonId,
      status: existingProgress?.status === "completed" ? "completed" : "in_progress",
      attempts: (existingProgress?.attempts ?? 0) + 1,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,lesson_id" }
  );

  if (progressError) {
    return NextResponse.json({ error: progressError.message }, { status: 500 });
  }

  return NextResponse.json({
    correct: isCorrect,
    correctOptionId: question.correct_option_id,
    explanation: question.explanation,
  });
}
