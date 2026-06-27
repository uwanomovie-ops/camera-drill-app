"use client";

import { Question, TYPE_LABELS, DIFFICULTY_LABELS } from "./types";

type Props = {
  question: Question | null;
};

function QuestionBody({ q }: { q: Question }) {
  if (q.type === "multiple_choice" || q.type === "true_false") {
    return (
      <div className="flex flex-col gap-1.5">
        {q.choices.map((c) => (
          <div
            key={c.label}
            className={`flex gap-2 items-center px-2.5 py-2 rounded-xl border text-xs ${
              c.label === q.answer
                ? "bg-green-50 border-green-300 text-green-800 font-bold"
                : "bg-white border-slate-200 text-slate-600"
            }`}
          >
            <span className="font-black w-4 shrink-0 text-center">{c.label}</span>
            <span>{c.text}</span>
            {c.label === q.answer && <span className="ml-auto text-green-500 text-xs">✓</span>}
          </div>
        ))}
      </div>
    );
  }

  if (q.type === "fill_blank") {
    const correct = q.answer.split(",");
    return (
      <div className="flex flex-col gap-1.5">
        {q.choices.map((c) => (
          <div
            key={c.label}
            className={`flex gap-2 items-center px-2.5 py-2 rounded-xl border text-xs ${
              correct.includes(c.label)
                ? "bg-green-50 border-green-300 text-green-800 font-bold"
                : "bg-white border-slate-200 text-slate-600"
            }`}
          >
            <span className="font-black w-4 shrink-0">{c.label}</span>
            <span>{c.text}</span>
            {correct.includes(c.label) && <span className="ml-auto text-green-500 text-xs">✓</span>}
          </div>
        ))}
      </div>
    );
  }

  if (q.type === "ordering") {
    const order = q.answer.split(",");
    return (
      <div className="flex flex-col gap-1.5">
        {order.map((label, i) => {
          const c = q.choices.find((ch) => ch.label === label);
          return (
            <div key={label} className="flex gap-2 items-center px-2.5 py-2 rounded-xl bg-green-50 border border-green-200 text-xs">
              <span className="font-black text-green-600 w-4 text-center">{i + 1}</span>
              <span className="text-slate-700">{c?.text}</span>
            </div>
          );
        })}
      </div>
    );
  }

  if (q.type === "matching") {
    const n = Math.floor(q.choices.length / 2);
    const leftItems = q.choices.slice(0, n);
    const rightItems = q.choices.slice(n);
    const pairs = q.answer.split(",").map((p) => p.split(":"));
    return (
      <div className="flex flex-col gap-1.5">
        {pairs.map(([l, r]) => {
          const left = leftItems.find((c) => c.label === l);
          const right = rightItems.find((c) => c.label === r);
          return (
            <div key={l} className="flex gap-1.5 items-center text-xs">
              <span className="flex-1 px-2 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-slate-700 truncate">{left?.text}</span>
              <span className="text-slate-300 shrink-0">→</span>
              <span className="flex-1 px-2 py-1.5 bg-green-50 border border-green-200 rounded-lg text-slate-700 truncate">{right?.text}</span>
            </div>
          );
        })}
      </div>
    );
  }

  return null;
}

export function QuestionPreview({ question }: Props) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
        <span className="text-xs font-bold text-slate-500">プレビュー</span>
        {question && (
          <div className="flex items-center gap-1">
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
              question.difficulty === "easy" ? "bg-green-100 text-green-700" :
              question.difficulty === "hard" ? "bg-red-100 text-red-700" :
              "bg-yellow-100 text-yellow-700"
            }`}>
              {DIFFICULTY_LABELS[question.difficulty]}
            </span>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${TYPE_LABELS[question.type]?.className}`}>
              {TYPE_LABELS[question.type]?.label}
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50 p-3">
        {question ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-3">
            <p className="text-sm font-bold text-slate-800 leading-relaxed">
              {question.question}
            </p>
            <QuestionBody q={question} />
            {question.explanation && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 mb-1">解説</p>
                <p className="text-xs text-slate-600 leading-relaxed">{question.explanation}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 py-8">
            <p className="text-4xl mb-3">📱</p>
            <p className="text-xs text-center leading-relaxed">問題を選択すると<br />ここにプレビューが表示されます</p>
          </div>
        )}
      </div>
    </div>
  );
}
