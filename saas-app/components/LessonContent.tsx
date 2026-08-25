"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Lesson } from "@/lib/types";

interface LessonContentProps {
  lesson: Lesson;
}

/**
 * Renderiza o `content` (jsonb) da lição — blocos de texto/imagem — e o botão
 * "Iniciar Quiz", que marca a lição como `in_progress` e navega para /lessons/[slug]/quiz.
 */
export function LessonContent({ lesson }: LessonContentProps) {
  const router = useRouter();
  const [starting, setStarting] = useState(false);

  async function startQuiz() {
    setStarting(true);
    try {
      await fetch("/api/progress/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId: lesson.id }),
      });
    } catch {
      // registro de progresso é "best effort" — não deve impedir o usuário de fazer o quiz
    } finally {
      router.push(`/lessons/${lesson.slug}/quiz`);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{lesson.title}</h1>

      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6">
        {lesson.content.blocks.map((block, i) =>
          block.type === "text" ? (
            <p key={i} className="text-slate-700">
              {block.value}
            </p>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={block.value} alt="" className="rounded-lg" />
          )
        )}
      </div>

      <button
        onClick={startQuiz}
        disabled={starting}
        className="self-start rounded-full bg-brand-600 px-6 py-2.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {starting ? "Iniciando..." : "Iniciar Quiz"}
      </button>
    </div>
  );
}
