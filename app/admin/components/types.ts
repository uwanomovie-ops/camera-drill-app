export type QuestionSet = {
  id: number;
  name: string;
  category: string;
  orderIndex: number;
  questionCount: number;
};

export type Question = {
  id: number;
  setId: number | null;
  category: string;
  question: string;
  choices: { label: string; text: string }[];
  answer: string;
  explanation: string;
  difficulty: string;
  type: string;
  orderIndex: number;
  published: boolean;
};

export const CATEGORIES = ["露出", "レンズ", "構図", "ライティング", "カメラの仕組み"] as const;

export const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "やさしい",
  medium: "ふつう",
  hard: "むずかしい",
};

export const TYPE_LABELS: Record<string, { label: string; className: string }> = {
  multiple_choice: { label: "4択", className: "bg-slate-100 text-slate-600" },
  true_false: { label: "○×", className: "bg-blue-100 text-blue-700" },
  fill_blank: { label: "穴埋め", className: "bg-purple-100 text-purple-700" },
  ordering: { label: "並べ替え", className: "bg-orange-100 text-orange-700" },
  matching: { label: "関連付け", className: "bg-teal-100 text-teal-700" },
};
