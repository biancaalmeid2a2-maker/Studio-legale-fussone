"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PublicQuestion, QuizSubmitResult } from "@/lib/types";

interface QuizProps {
  lessonId: string;
  lessonTitle: string;
  questions: PublicQuestion[];
}

/** Fluxo pergunta-a-pergunta do quiz de uma lição, com correção no servidor ao final. */
export function Quiz({ lessonId, lessonTitle, questions }: QuizProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizSubmitResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentQuestion = questions[currentIndex];

  function selectOption(questionId: string, optionId: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  }

  function goToNextQuestion() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      submitQuiz();
    }
  }

  async function submitQuiz() {
    setSubmitting(true);
    setError(null);

    const payload = {
      lessonId,
      answers: questions.map((q) => ({
        questionId: q.id,
        selectedOptionId: answers[q.id] ?? "",
      })),
    };

    try {
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Erro ao enviar respostas");
      const data: QuizSubmitResult = await res.json();
      setResult(data);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold">{result.passed ? "🎉 Você passou!" : "😕 Quase lá"}</h1>
        <p className="text-lg">
          Pontuação: <strong>{result.score}%</strong> ({result.totalQuestions} perguntas)
          {result.passed && <> · +{result.xpAwarded} XP</>}
        </p>

        <div className="flex flex-col gap-3">
          {questions.map((q, i) => {
            const r = result.results[i];
            return (
              <div
                key={q.id}
                className={`rounded-xl border p-4 ${
                  r.correct ? "border-brand-300 bg-brand-50" : "border-red-200 bg-red-50"
                }`}
              >
                <p className="font-semibold">{q.prompt}</p>
                {!r.correct && r.explanation && (
                  <p className="mt-1 text-sm text-slate-600">{r.explanation}</p>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={() => router.push("/dashboard")}
          className="self-start rounded-full bg-brand-600 px-6 py-2.5 font-semibold text-white hover:bg-brand-700"
        >
          Voltar ao painel
        </button>
      </div>
    );
  }

  if (!currentQuestion) {
    return <p className="text-sm text-slate-500">Esta lição ainda não tem perguntas cadastradas.</p>;
  }

  const selected = answers[currentQuestion.id];

  return (
    <div className="flex flex-col gap-6">
      <div className="text-sm font-semibold text-slate-500">
        {lessonTitle} · Pergunta {currentIndex + 1} de {questions.length}
      </div>
      <h2 className="text-xl font-bold">{currentQuestion.prompt}</h2>

      {currentQuestion.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={currentQuestion.image_url} alt="" className="rounded-lg" />
      )}

      <div className="flex flex-col gap-3">
        {currentQuestion.options.map((option) => (
          <button
            key={option.id}
            onClick={() => selectOption(currentQuestion.id, option.id)}
            className={`rounded-xl border px-4 py-3 text-left font-medium transition-colors ${
              selected === option.id
                ? "border-brand-600 bg-brand-50"
                : "border-slate-200 hover:bg-slate-50"
            }`}
          >
            {option.text}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={goToNextQuestion}
        disabled={!selected || submitting}
        className="self-start rounded-full bg-brand-600 px-6 py-2.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {submitting ? "Enviando..." : currentIndex < questions.length - 1 ? "Próxima" : "Finalizar"}
      </button>
    </div>
  );
}
