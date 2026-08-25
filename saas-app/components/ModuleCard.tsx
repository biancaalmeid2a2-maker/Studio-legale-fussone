import Link from "next/link";
import { ProgressBar } from "./ProgressBar";
import type { ModuleWithLessons, UserProgress } from "@/lib/types";

interface ModuleCardProps {
  module: ModuleWithLessons;
  progressByLessonId: Map<string, UserProgress>;
}

export function ModuleCard({ module, progressByLessonId }: ModuleCardProps) {
  const completedCount = module.lessons.filter(
    (l) => progressByLessonId.get(l.id)?.status === "completed"
  ).length;

  const firstIncomplete =
    module.lessons.find((l) => progressByLessonId.get(l.id)?.status !== "completed") ??
    module.lessons[0];

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="text-3xl">{module.icon}</span>
        <div>
          <h3 className="font-bold">{module.title}</h3>
          <p className="text-sm text-slate-500">{module.description}</p>
        </div>
      </div>

      <ProgressBar value={completedCount} max={module.lessons.length} />
      <p className="text-xs text-slate-500">
        {completedCount}/{module.lessons.length} lições concluídas
      </p>

      {firstIncomplete && (
        <Link
          href={`/lessons/${firstIncomplete.slug}`}
          className="mt-1 self-start rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          {completedCount === 0 ? "Começar" : "Continuar"}
        </Link>
      )}
    </div>
  );
}
