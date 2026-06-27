"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type Question = {
  id: number;
  category: string;
  question: string;
  choices: { label: string; text: string }[];
  answer: string;
  explanation: string;
  difficulty: string;
  type: string;
};

type Session = {
  id: number;
  score: number;
  total: number;
  completedAt: string;
};

type AppPhase = "start" | "quiz" | "finished";
type QuizPhase = "answering" | "correct" | "incorrect";

const CATEGORIES = ["露出", "レンズ", "構図", "ライティング", "カメラの仕組み"];

const DIFFICULTIES = [
  { value: "all", label: "すべて", color: "bg-slate-100 text-slate-600 border-slate-200" },
  { value: "easy", label: "やさしい", color: "bg-green-50 text-green-700 border-green-200" },
  { value: "medium", label: "ふつう", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  { value: "hard", label: "むずかしい", color: "bg-red-50 text-red-700 border-red-200" },
];

const TYPE_BADGE: Record<string, { label: string; className: string }> = {
  true_false: { label: "○×", className: "bg-blue-100 text-blue-700" },
  fill_blank: { label: "穴埋め", className: "bg-purple-100 text-purple-700" },
  ordering: { label: "並べ替え", className: "bg-orange-100 text-orange-700" },
  matching: { label: "関連付け", className: "bg-teal-100 text-teal-700" },
};

function getOrCreateUserId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("anon_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("anon_id", id);
  }
  return id;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function normalizeAnswer(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, "");
}

/** "A:D,B:F,C:E" → { A: "D", B: "F", C: "E" } */
function parseMatchAnswer(answer: string): Record<string, string> {
  return Object.fromEntries(answer.split(",").map((p) => p.split(":")));
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function FlagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21V4m0 0l7-1 4 2 7-1v13l-7 1-4-2-7 1V4z" />
    </svg>
  );
}

type MatchPair = { left: string; right: string };

function MatchingQuestion({
  leftItems,
  rightItems,
  pairs,
  selectedLeft,
  feedbackVisible,
  correctMap,
  onLeftTap,
  onRightTap,
  onReset,
}: {
  leftItems: { label: string; text: string }[];
  rightItems: { label: string; text: string }[];
  pairs: MatchPair[];
  selectedLeft: string | null;
  feedbackVisible: boolean;
  correctMap: Record<string, string>;
  onLeftTap: (label: string) => void;
  onRightTap: (label: string) => void;
  onReset: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const leftRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const rightRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [lines, setLines] = useState<{ x1: number; y1: number; x2: number; y2: number; correct?: boolean }[]>([]);

  const recalcLines = useCallback(() => {
    if (!containerRef.current) return;
    const box = containerRef.current.getBoundingClientRect();
    const next = pairs.map((pair) => {
      const li = leftItems.findIndex((i) => i.label === pair.left);
      const ri = rightItems.findIndex((i) => i.label === pair.right);
      const leftEl = leftRefs.current[li];
      const rightEl = rightRefs.current[ri];
      if (!leftEl || !rightEl) return null;
      const lr = leftEl.getBoundingClientRect();
      const rr = rightEl.getBoundingClientRect();
      const isCorrect = feedbackVisible && correctMap[pair.left] === pair.right;
      const isWrong = feedbackVisible && correctMap[pair.left] !== pair.right;
      return {
        x1: lr.right - box.left,
        y1: lr.top + lr.height / 2 - box.top,
        x2: rr.left - box.left,
        y2: rr.top + rr.height / 2 - box.top,
        correct: feedbackVisible ? isCorrect && !isWrong : undefined,
      };
    }).filter(Boolean) as typeof lines;
    setLines(next);
  }, [pairs, leftItems, rightItems, feedbackVisible, correctMap]);

  useEffect(() => {
    recalcLines();
  }, [recalcLines]);

  useEffect(() => {
    window.addEventListener("resize", recalcLines);
    return () => window.removeEventListener("resize", recalcLines);
  }, [recalcLines]);

  const completed = pairs.length === leftItems.length;

  return (
    <div className="flex flex-col gap-3">
      {/* Pair counter + reset */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400 font-bold">
          {completed
            ? <span className="text-slate-600">完成！確認してね</span>
            : <>{pairs.length}/{leftItems.length} ペア完成</>}
        </p>
        {!feedbackVisible && pairs.length > 0 && (
          <button onClick={onReset} className="text-xs text-slate-400 flex items-center gap-1 active:scale-95">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            リセット
          </button>
        )}
      </div>

      {/* Grid with SVG overlay */}
      <div ref={containerRef} className="relative grid grid-cols-2 gap-x-8 gap-y-2">
        {/* SVG lines layer */}
        <svg
          className="absolute inset-0 pointer-events-none overflow-visible"
          style={{ width: "100%", height: "100%" }}
        >
          {lines.map((line, i) => {
            const mx = (line.x1 + line.x2) / 2;
            const color = line.correct === undefined
              ? "#1e293b"
              : line.correct ? "#22c55e" : "#f87171";
            return (
              <g key={i}>
                <path
                  d={`M ${line.x1} ${line.y1} C ${mx} ${line.y1}, ${mx} ${line.y2}, ${line.x2} ${line.y2}`}
                  stroke={color}
                  strokeWidth={2}
                  fill="none"
                  strokeLinecap="round"
                />
                <circle cx={line.x1} cy={line.y1} r={4} fill={color} />
                <circle cx={line.x2} cy={line.y2} r={4} fill={color} />
              </g>
            );
          })}
          {/* Unconnected dots */}
          {leftItems.map((item, i) => {
            const isPaired = pairs.some((p) => p.left === item.label);
            if (isPaired) return null;
            const el = leftRefs.current[i];
            if (!el || !containerRef.current) return null;
            const box = containerRef.current.getBoundingClientRect();
            const r = el.getBoundingClientRect();
            const cx = r.right - box.left;
            const cy = r.top + r.height / 2 - box.top;
            const isActive = selectedLeft === item.label;
            return <circle key={`ldot-${i}`} cx={cx} cy={cy} r={4} fill={isActive ? "#1e293b" : "#cbd5e1"} />;
          })}
          {rightItems.map((item, i) => {
            const isPaired = pairs.some((p) => p.right === item.label);
            if (isPaired) return null;
            const el = rightRefs.current[i];
            if (!el || !containerRef.current) return null;
            const box = containerRef.current.getBoundingClientRect();
            const r = el.getBoundingClientRect();
            const cx = r.left - box.left;
            const cy = r.top + r.height / 2 - box.top;
            return <circle key={`rdot-${i}`} cx={cx} cy={cy} r={4} fill="#cbd5e1" />;
          })}
        </svg>

        {/* Left items */}
        <div className="flex flex-col gap-2">
          {leftItems.map((item, i) => {
            const isPaired = pairs.some((p) => p.left === item.label);
            const isSelected = selectedLeft === item.label;
            const pair = pairs.find((p) => p.left === item.label);
            const isCorrect = feedbackVisible && pair && correctMap[item.label] === pair.right;
            const isWrong = feedbackVisible && pair && correctMap[item.label] !== pair.right;

            let bg = "bg-white border-slate-200 text-slate-700";
            if (feedbackVisible) {
              if (isCorrect) bg = "bg-green-50 border-green-400 text-green-700";
              else if (isWrong) bg = "bg-red-50 border-red-300 text-red-600";
              else bg = "bg-slate-50 border-slate-100 text-slate-300";
            } else if (isSelected) {
              bg = "bg-slate-800 border-slate-800 text-white";
            } else if (isPaired) {
              bg = "bg-slate-100 border-slate-300 text-slate-700";
            }

            return (
              <button
                key={item.label}
                ref={(el) => { leftRefs.current[i] = el; }}
                disabled={feedbackVisible}
                onClick={() => onLeftTap(item.label)}
                className={`rounded-2xl border-2 px-3 py-3 text-sm font-semibold text-left transition-all active:scale-95 leading-snug ${bg}`}
              >
                {item.text}
              </button>
            );
          })}
        </div>

        {/* Right items */}
        <div className="flex flex-col gap-2">
          {rightItems.map((item, i) => {
            const pair = pairs.find((p) => p.right === item.label);
            const isPaired = !!pair;
            const isCorrect = feedbackVisible && pair && correctMap[pair.left] === item.label;
            const isWrong = feedbackVisible && pair && correctMap[pair.left] !== item.label;
            const isWaiting = selectedLeft !== null && !feedbackVisible;

            let bg = "bg-white border-slate-200 text-slate-700";
            if (feedbackVisible) {
              if (isCorrect) bg = "bg-green-50 border-green-400 text-green-700";
              else if (isWrong) bg = "bg-red-50 border-red-300 text-red-600";
              else bg = "bg-slate-50 border-slate-100 text-slate-300";
            } else if (isPaired) {
              bg = "bg-slate-100 border-slate-300 text-slate-700";
            } else if (isWaiting) {
              bg = "bg-white border-slate-300 text-slate-700 border-dashed";
            }

            return (
              <button
                key={item.label}
                ref={(el) => { rightRefs.current[i] = el; }}
                disabled={feedbackVisible}
                onClick={() => onRightTap(item.label)}
                className={`rounded-2xl border-2 px-3 py-3 text-sm font-semibold text-left transition-all active:scale-95 leading-snug ${bg}`}
              >
                {item.text}
              </button>
            );
          })}
        </div>
      </div>

      {/* Correct answer on wrong */}
      {feedbackVisible && pairs.some((p) => correctMap[p.left] !== p.right) && (
        <div className="bg-white rounded-2xl p-4 border border-green-200">
          <p className="text-xs font-bold text-green-600 mb-2">正しい組み合わせ</p>
          <div className="flex flex-col gap-1.5">
            {leftItems.map((left) => {
              const rightLabel = correctMap[left.label];
              const right = rightItems.find((r) => r.label === rightLabel);
              return (
                <div key={left.label} className="flex items-center gap-2 text-xs text-slate-700">
                  <span className="font-semibold flex-1 truncate">{left.text}</span>
                  <span className="text-slate-300">→</span>
                  <span className="font-semibold flex-1 truncate">{right?.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const map: Record<string, string> = {
    easy: "bg-green-100 text-green-700",
    medium: "bg-yellow-100 text-yellow-700",
    hard: "bg-red-100 text-red-700",
  };
  const label: Record<string, string> = { easy: "やさしい", medium: "ふつう", hard: "むずかしい" };
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${map[difficulty] ?? "bg-slate-100 text-slate-600"}`}>
      {label[difficulty] ?? difficulty}
    </span>
  );
}

export default function Home() {
  const [appPhase, setAppPhase] = useState<AppPhase>("start");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [questions, setQuestions] = useState<Question[]>([]);
  const [starting, setStarting] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [quizPhase, setQuizPhase] = useState<QuizPhase>("answering");
  const [correctCount, setCorrectCount] = useState(0);
  const [pastSessions, setPastSessions] = useState<Session[]>([]);
  const [answers, setAnswers] = useState<
    { questionId: number; selectedLabel: string; isCorrect: boolean }[]
  >([]);

  // multiple_choice / true_false
  const [selected, setSelected] = useState<string | null>(null);

  // fill_blank (choice-based)
  const [fillSelections, setFillSelections] = useState<(string | null)[]>([]);
  const [fillActiveBlank, setFillActiveBlank] = useState<number>(0);
  const fillInputRef = useRef<HTMLInputElement>(null);

  // ordering
  const [orderedLabels, setOrderedLabels] = useState<string[]>([]);

  // matching
  const [matchPairs, setMatchPairs] = useState<{ left: string; right: string }[]>([]);
  const [matchSelectedLeft, setMatchSelectedLeft] = useState<string | null>(null);

  useEffect(() => {
    const userId = getOrCreateUserId();
    fetch(`/api/sessions?userId=${userId}`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setPastSessions(data); });
  }, []);

  function resetQuizState() {
    setSelected(null);
    setFillSelections([]);
    setFillActiveBlank(0);
    setOrderedLabels([]);
    setMatchPairs([]);
    setMatchSelectedLeft(null);
    setQuizPhase("answering");
  }

  async function handleStart() {
    setStarting(true);
    const params = new URLSearchParams();
    if (selectedDifficulty !== "all") params.set("difficulty", selectedDifficulty);
    if (selectedCategory !== "all") params.set("category", selectedCategory);

    const data: Question[] = await fetch(`/api/questions?${params}`).then((r) => r.json());
    setQuestions(shuffle(data));
    setCurrentIndex(0);
    setCorrectCount(0);
    setAnswers([]);
    resetQuizState();
    setStarting(false);
    setAppPhase("quiz");
  }

  const question = questions[currentIndex];
  const isLast = currentIndex >= questions.length - 1;
  const feedbackVisible = quizPhase !== "answering";
  const isCorrect = quizPhase === "correct";
  const progress =
    questions.length > 0
      ? ((currentIndex + (feedbackVisible ? 1 : 0)) / questions.length) * 100
      : 0;

  // ── multiple_choice / true_false ──────────────────────────────────────
  function handleSelect(label: string) {
    if (feedbackVisible) return;
    setSelected(label);
  }

  function handleSubmitAnswer() {
    if (feedbackVisible || selected === null) return;
    const correct = selected === question.answer;
    setQuizPhase(correct ? "correct" : "incorrect");
    if (correct) setCorrectCount((c) => c + 1);
    setAnswers((prev) => [...prev, { questionId: question.id, selectedLabel: selected, isCorrect: correct }]);
  }

  // ── fill_blank (choice-based) ─────────────────────────────────────────
  const fillBlankCount = question ? question.question.split("___").length - 1 : 0;

  function handleFillChoiceTap(label: string) {
    if (feedbackVisible) return;
    const next = [...fillSelections];
    while (next.length < fillBlankCount) next.push(null);
    // 既に同じラベルが別のブランクに入っていたら外す
    const existing = next.indexOf(label);
    if (existing !== -1) next[existing] = null;
    next[fillActiveBlank] = label;
    setFillSelections(next);
    // 次の空ブランクに移動
    const nextEmpty = next.findIndex((v, i) => i !== fillActiveBlank && v === null);
    if (nextEmpty !== -1) setFillActiveBlank(nextEmpty);
  }

  function handleFillBlankTap(index: number) {
    if (feedbackVisible) return;
    setFillActiveBlank(index);
  }

  function handleFillSubmit() {
    if (feedbackVisible) return;
    const filled = fillSelections.slice(0, fillBlankCount);
    if (filled.some((v) => v === null)) return;
    const userAnswer = filled.join(",");
    const correct = [...filled].sort().join(",") === question.answer.split(",").sort().join(",");
    setQuizPhase(correct ? "correct" : "incorrect");
    if (correct) setCorrectCount((c) => c + 1);
    setAnswers((prev) => [...prev, { questionId: question.id, selectedLabel: userAnswer, isCorrect: correct }]);
  }

  // ── ordering ──────────────────────────────────────────────────────────
  function handleOrderingTap(label: string) {
    if (feedbackVisible) return;
    if (orderedLabels.includes(label)) {
      setOrderedLabels((prev) => prev.filter((l) => l !== label));
    } else {
      setOrderedLabels((prev) => [...prev, label]);
    }
  }

  function handleOrderingSubmit() {
    if (feedbackVisible || orderedLabels.length !== question.choices.length) return;
    const userAnswer = orderedLabels.join(",");
    const correct = userAnswer === question.answer;
    setQuizPhase(correct ? "correct" : "incorrect");
    if (correct) setCorrectCount((c) => c + 1);
    setAnswers((prev) => [...prev, { questionId: question.id, selectedLabel: userAnswer, isCorrect: correct }]);
  }

  // ── matching ──────────────────────────────────────────────────────────
  const matchN = question ? Math.floor(question.choices.length / 2) : 0;
  const matchLeftItems = question ? question.choices.slice(0, matchN) : [];
  const matchRightItems = question ? question.choices.slice(matchN) : [];

  function handleMatchLeftTap(label: string) {
    if (feedbackVisible) return;
    if (matchSelectedLeft === label) {
      setMatchSelectedLeft(null);
      return;
    }
    const existingPair = matchPairs.find((p) => p.left === label);
    if (existingPair) {
      setMatchPairs((prev) => prev.filter((p) => p.left !== label));
    }
    setMatchSelectedLeft(label);
  }

  function handleMatchRightTap(label: string) {
    if (feedbackVisible || matchSelectedLeft === null) return;
    setMatchPairs((prev) => {
      const withoutRight = prev.filter((p) => p.right !== label);
      const withoutLeft = withoutRight.filter((p) => p.left !== matchSelectedLeft);
      return [...withoutLeft, { left: matchSelectedLeft, right: label }];
    });
    setMatchSelectedLeft(null);
  }

  function handleMatchSubmit() {
    if (feedbackVisible || matchPairs.length !== matchLeftItems.length) return;
    const correct_map = parseMatchAnswer(question.answer);
    const allCorrect = matchPairs.every((p) => correct_map[p.left] === p.right);
    setQuizPhase(allCorrect ? "correct" : "incorrect");
    if (allCorrect) setCorrectCount((c) => c + 1);
    const summary = matchPairs.map((p) => `${p.left}:${p.right}`).join(",");
    setAnswers((prev) => [...prev, { questionId: question.id, selectedLabel: summary, isCorrect: allCorrect }]);
  }

  // ── navigation ────────────────────────────────────────────────────────
  async function handleNext() {
    if (isLast) {
      const userId = getOrCreateUserId();
      await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anonymousUserId: userId, score: correctCount, total: questions.length, answers }),
      });
      setAppPhase("finished");
    } else {
      setCurrentIndex((i) => i + 1);
      resetQuizState();
    }
  }

  function handleRestart() {
    setAppPhase("start");
    const userId = getOrCreateUserId();
    fetch(`/api/sessions?userId=${userId}`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setPastSessions(data); });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // START SCREEN
  // ═══════════════════════════════════════════════════════════════════════
  if (appPhase === "start") {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center px-5 pt-14 pb-10 gap-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="text-5xl">📷</div>
          <h1 className="text-2xl font-black text-slate-800 leading-tight">カメラドリル</h1>
          <p className="text-sm text-slate-500">撮影技術を楽しく身につけよう</p>
        </div>

        <div className="w-full max-w-xs flex flex-col gap-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">難易度</p>
          <div className="grid grid-cols-2 gap-2">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.value}
                onClick={() => setSelectedDifficulty(d.value)}
                className={`py-3 rounded-2xl text-sm font-bold border-2 transition-all active:scale-95 ${
                  selectedDifficulty === d.value
                    ? `${d.color} border-current shadow-sm`
                    : "bg-white text-slate-400 border-transparent shadow-sm"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full max-w-xs flex flex-col gap-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">カテゴリ</p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`py-3 rounded-2xl text-sm font-bold border-2 transition-all active:scale-95 ${
                selectedCategory === "all"
                  ? "bg-slate-800 text-white border-slate-800 shadow-sm"
                  : "bg-white text-slate-400 border-transparent shadow-sm"
              }`}
            >
              すべてのカテゴリ
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`py-3 rounded-2xl text-sm font-bold border-2 transition-all active:scale-95 ${
                  selectedCategory === cat
                    ? "bg-slate-800 text-white border-slate-800 shadow-sm"
                    : "bg-white text-slate-500 border-transparent shadow-sm"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {pastSessions.length > 0 && (
          <div className="w-full max-w-xs bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-bold text-slate-500 mb-3">過去の記録</p>
            <div className="flex flex-col gap-2">
              {pastSessions.slice(0, 3).map((s, i) => (
                <div key={s.id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">
                    {i === 0 ? "前回" : new Date(s.completedAt).toLocaleDateString("ja-JP", { month: "short", day: "numeric" })}
                  </span>
                  <span className="font-bold text-slate-700">
                    {s.score}/{s.total}（{Math.round((s.score / s.total) * 100)}%）
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="w-full max-w-xs mt-auto">
          <button
            onClick={handleStart}
            disabled={starting}
            className="w-full py-4 bg-pink-500 text-white rounded-2xl font-bold text-base tracking-wide shadow-md shadow-pink-200 active:scale-95 transition-all disabled:opacity-60"
          >
            {starting ? "読み込み中..." : "スタート →"}
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // FINISHED SCREEN
  // ═══════════════════════════════════════════════════════════════════════
  if (appPhase === "finished") {
    const percentage = Math.round((correctCount / questions.length) * 100);
    return (
      <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center px-6 gap-8">
        <div className="flex flex-col items-center gap-4">
          <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-200">
            <CheckIcon className="w-12 h-12 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black text-slate-800">レッスン完了！</h1>
            <p className="text-sm text-slate-500 mt-1">カメラドリル</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl w-full max-w-xs flex divide-x divide-slate-100 shadow-sm">
          <div className="flex-1 py-6 flex flex-col items-center gap-1">
            <span className="text-3xl font-black text-slate-800">{correctCount}/{questions.length}</span>
            <span className="text-xs text-slate-500">正解</span>
          </div>
          <div className="flex-1 py-6 flex flex-col items-center gap-1">
            <span className="text-3xl font-black text-pink-500">{percentage}%</span>
            <span className="text-xs text-slate-500">正答率</span>
          </div>
        </div>

        {pastSessions.length > 0 && (
          <div className="w-full max-w-xs bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-bold text-slate-500 mb-3">過去の記録</p>
            <div className="flex flex-col gap-2">
              {pastSessions.slice(0, 5).map((s, i) => (
                <div key={s.id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">
                    {i === 0 ? "今回" : new Date(s.completedAt).toLocaleDateString("ja-JP", { month: "short", day: "numeric" })}
                  </span>
                  <span className="font-bold text-slate-700">
                    {s.score}/{s.total}（{Math.round((s.score / s.total) * 100)}%）
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="w-full max-w-xs">
          <button
            onClick={handleRestart}
            className="w-full py-4 bg-pink-500 text-white rounded-2xl font-bold text-base tracking-wide shadow-md shadow-pink-200 active:scale-95 transition-all"
          >
            もう一度 →
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // LOADING
  // ═══════════════════════════════════════════════════════════════════════
  if (!question) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-slate-800 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">問題を読み込み中...</p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // QUIZ SCREEN
  // ═══════════════════════════════════════════════════════════════════════
  const typeBadge = TYPE_BADGE[question.type];

  // ordering helpers
  const orderingRemaining = question.choices.filter((c) => !orderedLabels.includes(c.label));
  const orderingAllPlaced = orderedLabels.length === question.choices.length;
  const correctOrderLabels = question.answer.split(",");

  // matching helpers
  const matchCorrectMap = question.type === "matching" ? parseMatchAnswer(question.answer) : {};
  const matchCompleted = matchPairs.length === matchLeftItems.length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header */}
      <div className="bg-white px-4 pt-4 pb-3 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={handleRestart}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 active:scale-90 transition-all"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
          <div className="text-right">
            <p className="text-[10px] text-slate-400 leading-none mb-0.5">📷 カメラドリル</p>
            <p className="text-sm font-bold text-slate-700 leading-tight">{question.category}</p>
          </div>
        </div>
        <div className="h-1 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full rounded-full bg-slate-800 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="px-4 pt-5 pb-4">
          {/* Q badge row */}
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-slate-800 text-white text-sm font-black px-3 py-1 rounded-full">Q{currentIndex + 1}</span>
            <span className="text-sm text-slate-400">/ {questions.length}問</span>
            <DifficultyBadge difficulty={question.difficulty} />
            {typeBadge && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${typeBadge.className}`}>{typeBadge.label}</span>
            )}
          </div>

          {/* Question text */}
          <h2 className="text-lg font-bold text-slate-800 leading-snug mb-2">{question.question}</h2>

          {/* Instruction hint */}
          {question.type === "ordering" && !feedbackVisible && (
            <p className="text-xs text-slate-400 mb-4">↓ 正しい順番にタップしてください</p>
          )}
          {question.type === "matching" && !feedbackVisible && (
            <p className="text-xs text-slate-400 mb-4">⊕ 左右のアイテムをタップして接続</p>
          )}
          {question.type !== "ordering" && question.type !== "matching" && <div className="mb-4" />}

          {/* ── multiple_choice ── */}
          {question.type === "multiple_choice" && (
            <div className="flex flex-col gap-3">
              {question.choices.map((choice) => {
                const isSelected = selected === choice.label;
                const isAnswered = feedbackVisible;
                const isChoiceCorrect = choice.label === question.answer;

                let cardStyle = "border border-slate-200 bg-white shadow-sm";
                let labelStyle = "bg-slate-100 text-slate-600";
                if (isAnswered) {
                  if (isChoiceCorrect) { cardStyle = "border border-green-200 bg-green-50 shadow-sm"; labelStyle = "bg-green-500 text-white"; }
                  else if (isSelected) { cardStyle = "border border-red-200 bg-red-50 shadow-sm"; labelStyle = "bg-red-400 text-white"; }
                  else { cardStyle = "border border-slate-100 bg-white shadow-sm opacity-40"; }
                } else if (isSelected) {
                  cardStyle = "border-2 border-slate-800 bg-white shadow-sm";
                  labelStyle = "bg-slate-800 text-white";
                }

                const showFilled = isSelected || (isAnswered && isChoiceCorrect);
                let radioOuter = "border-2 border-slate-300";
                let radioDot = "bg-slate-800";
                if (isAnswered && isChoiceCorrect) { radioOuter = "border-2 border-green-500"; radioDot = "bg-green-500"; }
                else if (isAnswered && isSelected) { radioOuter = "border-2 border-red-400"; radioDot = "bg-red-400"; }
                else if (isSelected) { radioOuter = "border-2 border-slate-800"; }

                return (
                  <button
                    key={choice.label}
                    disabled={isAnswered}
                    onClick={() => handleSelect(choice.label)}
                    className={`flex items-center gap-3 w-full rounded-2xl px-4 py-4 text-left transition-all active:scale-[0.98] ${cardStyle}`}
                  >
                    <span className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shrink-0 ${labelStyle}`}>
                      {isAnswered && isChoiceCorrect ? <CheckIcon className="w-4 h-4" /> : choice.label}
                    </span>
                    <span className="flex-1 text-sm font-semibold text-slate-700 leading-snug">{choice.text}</span>
                    <span className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center ${radioOuter}`}>
                      {showFilled && <span className={`w-2.5 h-2.5 rounded-full ${radioDot}`} />}
                    </span>
                  </button>
                );
              })}
              {!feedbackVisible && (
                <button
                  onClick={handleSubmitAnswer}
                  disabled={selected === null}
                  className="w-full py-4 mt-1 bg-slate-800 text-white rounded-2xl font-bold text-base active:scale-95 transition-all disabled:opacity-30"
                >
                  回答する →
                </button>
              )}
            </div>
          )}

          {/* ── true_false ── */}
          {question.type === "true_false" && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                {(question.choices.length > 0
                  ? question.choices
                  : [{ label: "A", text: "○" }, { label: "B", text: "×" }]
                ).map((choice) => {
                  const isSelected = selected === choice.label;
                  const isAnswered = feedbackVisible;
                  const isChoiceCorrect = choice.label === question.answer;
                  const isCircle = choice.text === "○" || choice.label === "A";

                  let bg = isCircle ? "bg-blue-50 border-blue-200 text-blue-600" : "bg-rose-50 border-rose-200 text-rose-600";
                  if (isAnswered) {
                    if (isChoiceCorrect) bg = "bg-green-100 border-green-400 text-green-700";
                    else if (isSelected) bg = "bg-red-100 border-red-400 text-red-600 opacity-80";
                    else bg = "bg-slate-50 border-slate-200 text-slate-300";
                  } else if (isSelected) {
                    bg = "bg-slate-800 border-slate-800 text-white";
                  }

                  return (
                    <button
                      key={choice.label}
                      disabled={isAnswered}
                      onClick={() => handleSelect(choice.label)}
                      className={`flex flex-col items-center justify-center rounded-3xl border-2 py-8 gap-2 font-black text-5xl transition-all active:scale-95 ${bg}`}
                    >
                      {choice.text}
                      {isAnswered && isChoiceCorrect && (
                        <span className="text-xs font-bold text-current opacity-70">正解</span>
                      )}
                    </button>
                  );
                })}
              </div>
              {!feedbackVisible && (
                <button
                  onClick={handleSubmitAnswer}
                  disabled={selected === null}
                  className="w-full py-4 bg-slate-800 text-white rounded-2xl font-bold text-base active:scale-95 transition-all disabled:opacity-30"
                >
                  回答する →
                </button>
              )}
            </div>
          )}

          {/* ── fill_blank ── */}
          {question.type === "fill_blank" && (() => {
            const segments = question.question.split("___");
            const correctLabels = question.answer.split(",");
            const allFilled = fillSelections.slice(0, fillBlankCount).length === fillBlankCount &&
              fillSelections.slice(0, fillBlankCount).every((v) => v !== null);

            return (
              <div className="flex flex-col gap-4">
                {/* Inline question with blank boxes */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 text-sm font-semibold text-slate-800 leading-loose">
                  {segments.map((seg, i) => (
                    <span key={i}>
                      {seg}
                      {i < segments.length - 1 && (() => {
                        const val = fillSelections[i] ?? null;
                        const choice = val ? question.choices.find((c) => c.label === val) : null;
                        const isActive = fillActiveBlank === i && !feedbackVisible;
                        const correctLabel = correctLabels[i];
                        const isCorrectBlank = feedbackVisible && val === correctLabel;
                        const isWrongBlank = feedbackVisible && val !== correctLabel;

                        let boxStyle = "border-b-2 border-slate-300 text-slate-400";
                        if (isActive) boxStyle = "border-b-2 border-slate-800 text-slate-800 bg-slate-50";
                        if (val && !feedbackVisible) boxStyle = "border-b-2 border-slate-800 text-slate-800 bg-slate-100";
                        if (isCorrectBlank) boxStyle = "border-b-2 border-green-500 text-green-700 bg-green-50";
                        if (isWrongBlank) boxStyle = "border-b-2 border-red-400 text-red-600 bg-red-50";

                        return (
                          <button
                            key={`blank-${i}`}
                            disabled={feedbackVisible}
                            onClick={() => handleFillBlankTap(i)}
                            className={`inline-block min-w-[64px] px-2 py-0.5 mx-1 rounded text-center text-sm font-bold transition-all ${boxStyle}`}
                          >
                            {choice ? choice.text : (isActive ? "▌" : "　　")}
                          </button>
                        );
                      })()}
                    </span>
                  ))}
                </div>

                {/* Word bank */}
                {!feedbackVisible && (
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                    <p className="text-xs font-bold text-slate-400 mb-3">≡ 選択肢から選んでください</p>
                    <div className="flex flex-wrap gap-2">
                      {question.choices.map((choice) => {
                        const usedIn = fillSelections.indexOf(choice.label);
                        const isUsed = usedIn !== -1;
                        return (
                          <button
                            key={choice.label}
                            onClick={() => handleFillChoiceTap(choice.label)}
                            className={`px-4 py-2 rounded-2xl text-sm font-bold border-2 transition-all active:scale-95 ${
                              isUsed
                                ? "bg-slate-200 border-slate-200 text-slate-400"
                                : "bg-white border-slate-300 text-slate-700 hover:border-slate-800"
                            }`}
                          >
                            {choice.text}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Wrong answer: show correct */}
                {feedbackVisible && !isCorrect && (
                  <div className="bg-white rounded-2xl p-4 border border-green-200">
                    <p className="text-xs font-bold text-green-600 mb-2">正解</p>
                    <div className="flex gap-2 flex-wrap">
                      {correctLabels.map((label, i) => {
                        const choice = question.choices.find((c) => c.label === label);
                        return (
                          <span key={i} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold">
                            {i + 1}番目: {choice?.text}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {!feedbackVisible && (
                  <button
                    onClick={handleFillSubmit}
                    disabled={!allFilled}
                    className="w-full py-4 bg-slate-800 text-white rounded-2xl font-bold text-base active:scale-95 transition-all disabled:opacity-30"
                  >
                    回答する →
                  </button>
                )}
              </div>
            );
          })()}

          {/* ── ordering ── */}
          {question.type === "ordering" && (
            <div className="flex flex-col gap-4">
              {/* Drop zone */}
              <div className={`min-h-[60px] rounded-2xl border-2 border-dashed p-3 flex flex-col gap-2 transition-colors ${
                orderedLabels.length > 0 ? "border-slate-300 bg-white" : "border-slate-200 bg-slate-50"
              }`}>
                {orderedLabels.length === 0 ? (
                  <p className="text-xs text-slate-300 text-center py-3">下の選択肢をタップして順番に並べてね</p>
                ) : (
                  orderedLabels.map((label, idx) => {
                    const choice = question.choices.find((c) => c.label === label)!;
                    const isAnswered = feedbackVisible;
                    const correctLabel = correctOrderLabels[idx];
                    const isPositionCorrect = correctLabel === label;

                    let bg = "bg-slate-800 text-white";
                    if (isAnswered) {
                      bg = isPositionCorrect ? "bg-green-500 text-white" : "bg-red-400 text-white";
                    }

                    return (
                      <button
                        key={label}
                        disabled={isAnswered}
                        onClick={() => handleOrderingTap(label)}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all active:scale-[0.98] ${bg}`}
                      >
                        <span className="text-xs font-black opacity-60 w-4">{idx + 1}</span>
                        <span className="flex-1 text-sm font-semibold leading-snug">{choice.text}</span>
                        {!isAnswered && <span className="text-xs opacity-50">✕</span>}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Remaining pool */}
              <div className="flex flex-col gap-2">
                {orderingRemaining.map((choice) => (
                  <button
                    key={choice.label}
                    disabled={feedbackVisible}
                    onClick={() => handleOrderingTap(choice.label)}
                    className="flex items-center gap-3 w-full rounded-2xl px-4 py-4 text-left bg-white border border-slate-200 shadow-sm transition-all active:scale-[0.98]"
                  >
                    <span className="flex-1 text-sm font-semibold text-slate-700 leading-snug">{choice.text}</span>
                  </button>
                ))}
              </div>

              {/* Correct order on wrong answer */}
              {feedbackVisible && !isCorrect && (
                <div className="bg-white rounded-2xl p-4 border border-green-200">
                  <p className="text-xs font-bold text-green-600 mb-2">正しい順番</p>
                  <div className="flex flex-col gap-1.5">
                    {correctOrderLabels.map((label, idx) => {
                      const choice = question.choices.find((c) => c.label === label)!;
                      return (
                        <div key={label} className="flex items-center gap-2 text-sm text-slate-700">
                          <span className="text-xs font-black text-green-500 w-4">{idx + 1}</span>
                          <span className="font-semibold">{choice?.text}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {!feedbackVisible && (
                <button
                  onClick={handleOrderingSubmit}
                  disabled={!orderingAllPlaced}
                  className="w-full py-4 bg-slate-800 text-white rounded-2xl font-bold text-base active:scale-95 transition-all disabled:opacity-30"
                >
                  回答する →
                </button>
              )}
            </div>
          )}

          {/* ── matching ── */}
          {question.type === "matching" && (
            <div className="flex flex-col gap-4">
              <MatchingQuestion
                leftItems={matchLeftItems}
                rightItems={matchRightItems}
                pairs={matchPairs}
                selectedLeft={matchSelectedLeft}
                feedbackVisible={feedbackVisible}
                correctMap={matchCorrectMap}
                onLeftTap={handleMatchLeftTap}
                onRightTap={handleMatchRightTap}
                onReset={() => { setMatchPairs([]); setMatchSelectedLeft(null); }}
              />
              {!feedbackVisible && (
                <button
                  onClick={handleMatchSubmit}
                  disabled={!matchCompleted}
                  className="w-full py-4 bg-slate-800 text-white rounded-2xl font-bold text-base active:scale-95 transition-all disabled:opacity-30"
                >
                  回答する →
                </button>
              )}
            </div>
          )}
        </div>

        {/* Feedback panel */}
        {feedbackVisible && (
          <div className={`px-4 pt-5 pb-8 ${isCorrect ? "bg-green-50" : "bg-red-50"}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${isCorrect ? "bg-green-500" : "bg-red-400"}`}>
                  {isCorrect ? <CheckIcon className="w-3.5 h-3.5 text-white" /> : <CloseIcon className="w-3 h-3 text-white" />}
                </span>
                <span className={`text-xl font-black ${isCorrect ? "text-green-700" : "text-red-600"}`}>
                  {isCorrect ? "正解！" : "不正解..."}
                </span>
              </div>
              <button className="text-slate-400 p-1">
                <FlagIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
              <p className={`text-xs font-bold mb-2 ${isCorrect ? "text-green-600" : "text-red-500"}`}>
                マスターのワンポイント
              </p>
              <p className="text-sm text-slate-700 leading-relaxed">{question.explanation}</p>
            </div>

            <button
              onClick={handleNext}
              className="w-full py-4 bg-white rounded-2xl font-bold text-base text-slate-800 shadow-sm active:scale-95 transition-all"
            >
              {isLast ? "結果を見る →" : "次の問題へ →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
