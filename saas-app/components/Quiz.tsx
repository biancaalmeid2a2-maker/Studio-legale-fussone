"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AskAI } from "@/components/AskAI";
import type { PublicQuestion, QuizSubmitResult } from "@/lib/types";

interface QuizProps {
  lessonId: string;
  lessonSlug: string;
  lessonTitle: string;
  questions: PublicQuestion[];
  /** slug da próxima lição do mesmo módulo, se houver — habilita o botão "Próxima lição". */
  nextLessonSlug: string | null;
}

interface AnswerFeedback {
  correct: boolean;
  correctOptionId: string;
  explanation: string | null;
}

/**
 * Fluxo pergunta-a-pergunta: o usuário escolhe uma opção, clica em "Responder"
 * e recebe feedback imediato (certo/errado + explicação) antes de avançar.
 * Cada resposta já é gravada em user_answers e soma attempts em user_progress
 * via /api/quiz/answer; ao final, /api/quiz/submit fecha a lição (status,
 * score, completed_at) e atualiza user_stats (XP e streak).
 */
export function Quiz({ lessonId, lessonSlug, lessonTitle, questions, nextLessonSlug }: QuizProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [feedbackByQuestion, setFeedbackByQuestion] = useState<Record<string, AnswerFeedback>>(
    {}
  );
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizSubmitResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentQuestion = questions[currentIndex];
  const currentFeedback = currentQuestion ? feedbackByQuestion[currentQuestion.id] : undefined;

  const feedbackValues = Object.values(feedbackByQuestion);
  const correctSoFar = feedbackValues.filter((f) => f.correct).length;
  const incorrectSoFar = feedbackValues.filter((f) => !f.correct).length;

  function selectOption(questionId: string, optionId: string) {
    if (feedbackByQuestion[questionId]) return; // já respondida — não deixa trocar
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  }

  async function checkAnswer() {
    const selectedOptionId = answers[currentQuestion.id];
    if (!selectedOptionId) return;

    setChecking(true);
    setError(null);
    try {
      const res = await fetch("/api/quiz/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, questionId: currentQuestion.id, selectedOptionId }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Erro ao validar resposta");
      const feedback: AnswerFeedback = await res.json();
      setFeedbackByQuestion((prev) => ({ ...prev, [currentQuestion.id]: feedback }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setChecking(false);
    }
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
    const correctCount = result.results.filter((r) => r.correct).length;

    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold">{result.passed ? "🎉 Você passou!" : "😕 Quase lá"}</h1>
        <p className="text-lg">
          <strong>
            {correctCount}/{result.totalQuestions}
          </strong>{" "}
          acertos · <strong>{result.score}%</strong> de pontuação
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

        <div className="flex flex-wrap gap-3">
          {nextLessonSlug && (
            <button
              onClick={() => router.push(`/lessons/${nextLessonSlug}`)}
              className="rounded-full bg-brand-600 px-6 py-2.5 font-semibold text-white hover:bg-brand-700"
            >
              Próxima lição →
            </button>
          )}
          <button
            onClick={() => router.push(`/lessons/${lessonSlug}`)}
            className="rounded-full border border-slate-300 px-6 py-2.5 font-semibold hover:bg-slate-100"
          >
            Revisar lição
          </button>
          <button
            onClick={() => router.push("/modules")}
            className="rounded-full border border-slate-300 px-6 py-2.5 font-semibold hover:bg-slate-100"
          >
            Voltar para módulos
          </button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <p className="text-sm text-slate-500">Esta lição ainda não tem perguntas cadastradas.</p>
    );
  }

  const selected = answers[currentQuestion.id];
  const isLastQuestion = currentIndex === questions.length - 1;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between text-sm font-semibold text-slate-500">
        <span>
          {lessonTitle} · Pergunta {currentIndex + 1} de {questions.length}
        </span>
        <span className="flex gap-3">
          <span className="text-brand-700">✅ {correctSoFar}</span>
          <span className="text-red-600">❌ {incorrectSoFar}</span>
        </span>
      </div>

      <h2 className="text-xl font-bold">{currentQuestion.prompt}</h2>

      {currentQuestion.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={currentQuestion.image_url} alt="" className="rounded-lg" />
      )}

      <div className="flex flex-col gap-3">
        {currentQuestion.options.map((option) => {
          const isSelected = selected === option.id;
          const isCorrectOption = currentFeedback?.correctOptionId === option.id;

          let optionClass = "border-slate-200 hover:bg-slate-50";
          if (currentFeedback && isCorrectOption) {
            optionClass = "border-brand-600 bg-brand-50";
          } else if (currentFeedback && isSelected && !isCorrectOption) {
            optionClass = "border-red-400 bg-red-50";
          } else if (!currentFeedback && isSelected) {
            optionClass = "border-brand-600 bg-brand-50";
          }

          return (
            <button
              key={option.id}
              onClick={() => selectOption(currentQuestion.id, option.id)}
              disabled={!!currentFeedback}
              className={`rounded-xl border px-4 py-3 text-left font-medium transition-colors disabled:cursor-default ${optionClass}`}
            >
              {option.text}
            </button>
          );
        })}
      </div>

      {currentFeedback && (
        <div
          className={`rounded-xl border p-4 text-sm ${
            currentFeedback.correct
              ? "border-brand-300 bg-brand-50 text-brand-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          <p className="font-semibold">
            {currentFeedback.correct ? "Certinho! ✅" : "Não foi dessa vez ❌"}
          </p>
          {currentFeedback.explanation && <p className="mt-1">{currentFeedback.explanation}</p>}
        </div>
      )}

      {currentFeedback && (
        <AskAI key={currentQuestion.id} type="question" questionId={currentQuestion.id} />
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!currentFeedback ? (
        <button
          onClick={checkAnswer}
          disabled={!selected || checking}
          className="self-start rounded-full bg-brand-600 px-6 py-2.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {checking ? "Verificando..." : "Responder"}
        </button>
      ) : (
        <button
          onClick={goToNextQuestion}
          disabled={submitting}
          className="self-start rounded-full bg-brand-600 px-6 py-2.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {submitting ? "Enviando..." : isLastQuestion ? "Finalizar" : "Próxima"}
        </button>
      )}
    </div>
  );
}
