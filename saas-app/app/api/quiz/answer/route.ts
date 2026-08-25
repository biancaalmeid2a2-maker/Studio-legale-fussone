import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/quiz/answer — valida UMA resposta em tempo real, para feedback
 * imediato na tela (Duolingo-style: responde → vê se acertou → segue em frente).
 *
 * Não grava nada em `user_answers`: o registro definitivo (e a atualização de
 * user_progress/user_stats) acontece uma única vez em /api/quiz/submit, ao
 * final do quiz — assim não há linhas duplicadas se o usuário voltar/refizer.
 */
export async function POST(request: Request) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { questionId, selectedOptionId } = (await request.json()) as {
    questionId?: string;
    selectedOptionId?: string;
  };

  if (!questionId || !selectedOptionId) {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const { data: question, error } = await supabase
    .from("questions")
    .select("correct_option_id, explanation")
    .eq("id", questionId)
    .single();

  if (error || !question) {
    return NextResponse.json({ error: "Pergunta não encontrada" }, { status: 404 });
  }

  return NextResponse.json({
    correct: question.correct_option_id === selectedOptionId,
    correctOptionId: question.correct_option_id,
    explanation: question.explanation,
  });
}
