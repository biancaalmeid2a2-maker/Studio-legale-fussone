"use client";

import { useState } from "react";

type AskAIProps = { type: "question"; questionId: string } | { type: "lesson"; lessonId: string };

/** Botão "Explicar melhor com IA" — chama /api/ai/explain e exibe a explicação gerada. */
export function AskAI(props: AskAIProps) {
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function ask() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(props),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Erro ao gerar explicação");
      const data: { explanation: string } = await res.json();
      setExplanation(data.explanation);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  if (explanation) {
    return (
      <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-900">
        <p className="mb-1 font-semibold">🤖 Explicação da IA</p>
        <p className="whitespace-pre-line">{explanation}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={ask}
        disabled={loading}
        className="self-start rounded-full border border-indigo-300 px-4 py-1.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 disabled:opacity-60"
      >
        {loading ? "Pensando..." : "🤖 Explicar melhor com IA"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
