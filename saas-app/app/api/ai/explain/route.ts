import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import type { QuestionOption } from "@/lib/types";

type ExplainRequest =
  | { type: "question"; questionId: string }
  | { type: "lesson"; lessonId: string };

const SYSTEM_PROMPT =
  "Você é um tutor paciente que ajuda turistas estrangeiros a se preparar para a " +
  "prova teórica da carta de motorista na Itália. Responda sempre em português " +
  "do Brasil, de forma direta e didática, sem inventar regras de trânsito que " +
  "não estejam no material fornecido.";

/**
 * POST /api/ai/explain — body: { type: "question", questionId } | { type: "lesson", lessonId }
 *
 * Gera uma explicação sob demanda com o Claude para uma pergunta do quiz ou o
 * tópico de uma lição. O conteúdo real é buscado no Supabase no servidor (o
 * cliente nunca envia texto livre), e a chamada à API da Anthropic acontece
 * inteiramente aqui — a chave nunca é exposta ao navegador.
 */
export async function POST(request: Request) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = (await request.json()) as Partial<ExplainRequest>;

  let userPrompt: string;

  if (body.type === "question" && body.questionId) {
    const { data: question, error } = await supabase
      .from("questions")
      .select("prompt, options, correct_option_id, explanation")
      .eq("id", body.questionId)
      .single();

    if (error || !question) {
      return NextResponse.json({ error: "Pergunta não encontrada" }, { status: 404 });
    }

    const options = question.options as QuestionOption[];
    const optionsText = options.map((o) => `${o.id}) ${o.text}`).join("\n");
    const correctText =
      options.find((o) => o.id === question.correct_option_id)?.text ??
      question.correct_option_id;

    userPrompt = [
      "Um aluno estrangeiro está estudando para a prova teórica de trânsito da carta de motorista na Itália e tem dúvida sobre esta pergunta de múltipla escolha:",
      `Pergunta: ${question.prompt}`,
      `Opções:\n${optionsText}`,
      `Resposta correta: ${correctText}`,
      question.explanation ? `Explicação já dada ao aluno: ${question.explanation}` : "",
      "Explique, em no máximo 4 frases, por que essa é a resposta certa e qual conceito de trânsito está por trás dela.",
    ]
      .filter(Boolean)
      .join("\n\n");
  } else if (body.type === "lesson" && body.lessonId) {
    const { data: lesson, error } = await supabase
      .from("lessons")
      .select("title, content")
      .eq("id", body.lessonId)
      .single();

    if (error || !lesson) {
      return NextResponse.json({ error: "Lição não encontrada" }, { status: 404 });
    }

    const content = lesson.content as { blocks: Array<{ type: string; value: string }> };
    const lessonText = (content.blocks ?? [])
      .filter((b) => b.type === "text")
      .map((b) => b.value)
      .join("\n");

    userPrompt = [
      `Um aluno estrangeiro está com dúvida sobre a lição "${lesson.title}" do curso de preparação para a prova teórica de trânsito na Itália.`,
      `Conteúdo da lição:\n${lessonText}`,
      "Explique o tema de forma mais simples e didática, em no máximo 6 frases, sem sair do que está descrito no conteúdo acima.",
    ].join("\n\n");
  } else {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  try {
    const anthropic = new Anthropic();

    const message = await anthropic.messages.create({
      model: "claude-opus-5",
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const textBlock = message.content.find((block) => block.type === "text");

    return NextResponse.json({
      explanation: textBlock?.type === "text" ? textBlock.text : "",
    });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return NextResponse.json(
        { error: "IA não configurada (defina ANTHROPIC_API_KEY no servidor)." },
        { status: 500 }
      );
    }
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: "IA sobrecarregada no momento, tente novamente em instantes." },
        { status: 429 }
      );
    }
    if (error instanceof Anthropic.APIError) {
      return NextResponse.json({ error: `Erro da IA: ${error.message}` }, { status: 502 });
    }
    return NextResponse.json({ error: "Erro inesperado ao gerar explicação" }, { status: 500 });
  }
}
