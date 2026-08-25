export type QuestionType = "multiple_choice" | "true_false" | "image_choice";
export type ProgressStatus = "not_started" | "in_progress" | "completed";

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Module {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  icon: string | null;
  order_index: number;
}

export interface Lesson {
  id: string;
  module_id: string;
  slug: string;
  title: string;
  content: { blocks: Array<{ type: "text" | "image"; value: string }> };
  order_index: number;
  xp_reward: number;
}

/** Pergunta enviada ao cliente ANTES de responder — sem gabarito. */
export interface PublicQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  image_url: string | null;
  options: QuestionOption[];
  order_index: number;
}

export interface ModuleWithLessons extends Module {
  lessons: Lesson[];
}

export interface QuizAnswerInput {
  questionId: string;
  selectedOptionId: string;
}

export interface QuizResultItem {
  questionId: string;
  correct: boolean;
  correctOptionId: string;
  explanation: string | null;
}

export interface QuizSubmitResult {
  score: number;
  totalQuestions: number;
  passed: boolean;
  xpAwarded: number;
  results: QuizResultItem[];
}

export interface UserStats {
  user_id: string;
  xp_total: number;
  hearts: number;
  streak_current: number;
  streak_longest: number;
  last_activity_date: string | null;
}

export interface UserProgress {
  lesson_id: string;
  status: ProgressStatus;
  score: number | null;
  attempts: number;
}

/** Linha de user_progress com a lição (e o módulo dela) embutidos, para a página de perfil. */
export interface ProgressListItem {
  status: ProgressStatus;
  score: number | null;
  attempts: number;
  completed_at: string | null;
  lessons: {
    title: string;
    slug: string;
    xp_reward: number;
    modules: { title: string } | null;
  } | null;
}
