"use client";

import { useState, useEffect } from "react";
import { Question, QuestionSet, CATEGORIES, DIFFICULTY_LABELS, TYPE_LABELS } from "./types";

type EditorTab = "edit" | "add" | "stats";

type Props = {
  selectedQuestion: Question | null;
  selectedSetId: number | null;
  sets: QuestionSet[];
  onQuestionSaved: () => void;
  onQuestionUpdated: (q: Question) => void;
  onMoveQuestion: (id: number, direction: "up" | "down") => void;
};

// ── Shared badge components ──────────────────────────────────────────────────

function DifficultyBadge({ value }: { value: string }) {
  const colors: Record<string, string> = {
    easy: "bg-green-100 text-green-700",
    medium: "bg-yellow-100 text-yellow-700",
    hard: "bg-red-100 text-red-700",
  };
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors[value] ?? "bg-slate-100 text-slate-600"}`}>
      {DIFFICULTY_LABELS[value] ?? value}
    </span>
  );
}

// ── Edit Form ────────────────────────────────────────────────────────────────

function EditForm({
  question, sets, selectedSetId, onSaved, onUpdated, onMove,
}: {
  question: Question;
  sets: QuestionSet[];
  selectedSetId: number | null;
  onSaved: () => void;
  onUpdated: (q: Question) => void;
  onMove: (id: number, dir: "up" | "down") => void;
}) {
  const [form, setForm] = useState<Partial<Question>>(question);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    setForm(question);
    setMsg(null);
  }, [question.id]);

  const type = form.type ?? question.type;
  const choices = form.choices ?? question.choices;

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/questions/${question.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      const updated = await res.json();
      setMsg({ type: "success", text: "保存しました" });
      onUpdated(updated);
      onSaved();
      setTimeout(() => setMsg(null), 2000);
    } else {
      setMsg({ type: "error", text: "保存に失敗しました" });
    }
  }

  async function handleDelete() {
    if (!confirm("この問題を削除しますか？")) return;
    await fetch(`/api/questions/${question.id}`, { method: "DELETE" });
    onSaved();
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">#{question.id}</span>
          <DifficultyBadge value={form.difficulty ?? question.difficulty} />
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${TYPE_LABELS[type]?.className}`}>
            {TYPE_LABELS[type]?.label}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onMove(question.id, "up")}
            className="text-slate-400 hover:text-slate-600 border border-slate-200 px-2 py-1 rounded-lg text-xs transition-colors"
            title="上に移動"
          >▲</button>
          <button
            onClick={() => onMove(question.id, "down")}
            className="text-slate-400 hover:text-slate-600 border border-slate-200 px-2 py-1 rounded-lg text-xs transition-colors"
            title="下に移動"
          >▼</button>
          <button
            onClick={handleDelete}
            className="text-red-400 hover:text-red-600 border border-red-100 px-3 py-1 rounded-lg text-xs hover:bg-red-50 transition-colors"
          >
            削除
          </button>
        </div>
      </div>

      {/* Set assignment */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold text-slate-500">所属セット</label>
        <select
          value={form.setId ?? ""}
          onChange={(e) => setForm({ ...form, setId: e.target.value ? Number(e.target.value) : null })}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
        >
          <option value="">未割り当て</option>
          {sets.map((s) => (
            <option key={s.id} value={s.id}>{s.category} / {s.name}</option>
          ))}
        </select>
      </div>

      {/* Category & Difficulty */}
      <div className="flex gap-3">
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-xs font-bold text-slate-500">カテゴリ</label>
          <select
            value={form.category ?? question.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-xs font-bold text-slate-500">難易度</label>
          <select
            value={form.difficulty ?? question.difficulty}
            onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            {Object.entries(DIFFICULTY_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Question text */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold text-slate-500">問題文</label>
        <textarea
          value={form.question ?? question.question}
          onChange={(e) => setForm({ ...form, question: e.target.value })}
          rows={3}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 resize-none"
        />
      </div>

      {/* Choices for multiple_choice / true_false */}
      {(type === "multiple_choice" || type === "true_false") && (
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-500">選択肢</label>
          {choices.map((c, i) => (
            <div key={c.label} className="flex gap-2 items-center">
              <span className="text-xs font-black text-slate-500 w-5 text-center">{c.label}</span>
              <input
                value={c.text}
                disabled={type === "true_false"}
                onChange={(e) => {
                  const next = [...choices];
                  next[i] = { ...next[i], text: e.target.value };
                  setForm({ ...form, choices: next });
                }}
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>
          ))}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-bold text-slate-500">正解：</span>
            <select
              value={form.answer ?? question.answer}
              onChange={(e) => setForm({ ...form, answer: e.target.value })}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
            >
              {choices.map((c) => (
                <option key={c.label} value={c.label}>
                  {c.label}{type === "true_false" ? `（${c.text}）` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Answer for fill_blank / ordering / matching */}
      {(type === "fill_blank" || type === "ordering" || type === "matching") && (
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-500">選択肢（読み取り専用）</label>
          <div className="flex flex-col gap-1">
            {choices.map((c) => (
              <span key={c.label} className="text-xs bg-slate-50 text-slate-600 px-3 py-1.5 rounded-lg border border-slate-100">
                {c.label}. {c.text}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-bold text-slate-500 shrink-0">
              {type === "ordering" ? "正解順：" : type === "matching" ? "正解ペア：" : "正解："}
            </span>
            <input
              value={form.answer ?? question.answer}
              onChange={(e) => setForm({ ...form, answer: e.target.value })}
              placeholder={type === "ordering" ? "例: A,C,B,D" : type === "matching" ? "例: A:D,B:E,C:F" : "例: A,B"}
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Explanation */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold text-slate-500">解説</label>
        <textarea
          value={form.explanation ?? question.explanation}
          onChange={(e) => setForm({ ...form, explanation: e.target.value })}
          rows={3}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 resize-none"
        />
      </div>

      {msg && (
        <p className={`text-sm px-3 py-2 rounded-xl ${msg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
          {msg.text}
        </p>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-3 bg-slate-800 text-white rounded-xl text-sm font-bold disabled:opacity-50 active:scale-95 transition-all"
        >
          {saving ? "保存中..." : "変更を保存"}
        </button>
        <button
          onClick={async () => {
            const nextPublished = !(form.published ?? question.published);
            setSaving(true);
            const res = await fetch(`/api/questions/${question.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...form, published: nextPublished }),
            });
            setSaving(false);
            if (res.ok) {
              const updated = await res.json();
              setForm(updated);
              setMsg({ type: "success", text: nextPublished ? "ドリルに公開しました ✓" : "下書きに戻しました" });
              onUpdated(updated);
              onSaved();
              setTimeout(() => setMsg(null), 2000);
            }
          }}
          disabled={saving}
          className={`px-4 py-3 rounded-xl text-sm font-bold disabled:opacity-50 active:scale-95 transition-all border ${
            (form.published ?? question.published)
              ? "border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100"
              : "border-green-300 text-green-700 bg-green-50 hover:bg-green-100"
          }`}
        >
          {(form.published ?? question.published) ? "下書きに戻す" : "公開する →"}
        </button>
      </div>
    </div>
  );
}

// ── Manual Add Form ──────────────────────────────────────────────────────────

const TRUE_FALSE_CHOICES = [
  { label: "A", text: "○" },
  { label: "B", text: "×" },
];
const LABELS = ["A", "B", "C", "D", "E", "F", "G", "H"];

function ManualAddForm({
  selectedSetId, sets, onSaved,
}: {
  selectedSetId: number | null;
  sets: QuestionSet[];
  onSaved: () => void;
}) {
  const [type, setType] = useState("multiple_choice");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [difficulty, setDifficulty] = useState("medium");
  const [setId, setSetId] = useState<number | null>(selectedSetId);
  const [questionText, setQuestionText] = useState("");
  const [explanation, setExplanation] = useState("");
  const [mcChoices, setMcChoices] = useState(["", "", "", ""]);
  const [mcAnswer, setMcAnswer] = useState("A");
  const [tfAnswer, setTfAnswer] = useState("A");
  const [fbAnswer, setFbAnswer] = useState("");
  const [orderItems, setOrderItems] = useState(["", "", "", ""]);
  const [matchRows, setMatchRows] = useState([
    { left: "", right: "" },
    { left: "", right: "" },
    { left: "", right: "" },
  ]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    setSetId(selectedSetId);
  }, [selectedSetId]);

  function buildPayload() {
    if (!questionText.trim()) return null;
    if (type === "multiple_choice") {
      const choices = mcChoices.map((text, i) => ({ label: LABELS[i], text }));
      return { type, category, difficulty, question: questionText, choices, answer: mcAnswer, explanation, setId };
    }
    if (type === "true_false") {
      return { type, category, difficulty, question: questionText, choices: TRUE_FALSE_CHOICES, answer: tfAnswer, explanation, setId };
    }
    if (type === "fill_blank") {
      if (!fbAnswer.trim()) return null;
      return { type, category, difficulty, question: questionText, choices: [], answer: fbAnswer.trim(), explanation, setId };
    }
    if (type === "ordering") {
      const filled = orderItems.filter((t) => t.trim());
      if (filled.length < 2) return null;
      const choices = filled.map((text, i) => ({ label: LABELS[i], text }));
      return { type, category, difficulty, question: questionText, choices, answer: choices.map((c) => c.label).join(","), explanation, setId };
    }
    if (type === "matching") {
      const filled = matchRows.filter((r) => r.left.trim() && r.right.trim());
      if (filled.length < 2) return null;
      const n = filled.length;
      const leftChoices = filled.map((r, i) => ({ label: LABELS[i], text: r.left }));
      const rightChoices = filled.map((r, i) => ({ label: LABELS[n + i], text: r.right }));
      return {
        type, category, difficulty, question: questionText,
        choices: [...leftChoices, ...rightChoices],
        answer: leftChoices.map((l, i) => `${l.label}:${rightChoices[i].label}`).join(","),
        explanation, setId,
      };
    }
    return null;
  }

  async function handleSubmit() {
    const payload = buildPayload();
    if (!payload) return;
    setSaving(true);
    const res = await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) {
      setMsg({ type: "success", text: "問題を追加しました" });
      setQuestionText("");
      setExplanation("");
      setMcChoices(["", "", "", ""]);
      setFbAnswer("");
      setOrderItems(["", "", "", ""]);
      setMatchRows([{ left: "", right: "" }, { left: "", right: "" }, { left: "", right: "" }]);
      onSaved();
      setTimeout(() => setMsg(null), 2000);
    } else {
      setMsg({ type: "error", text: "追加に失敗しました" });
    }
  }

  const TYPE_TABS = [
    { value: "multiple_choice", label: "4択" },
    { value: "true_false", label: "○×" },
    { value: "fill_blank", label: "穴埋め" },
    { value: "ordering", label: "並べ替え" },
    { value: "matching", label: "関連付け" },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Type tabs */}
      <div className="flex flex-wrap gap-1.5">
        {TYPE_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setType(t.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              type === t.value ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Set / Category / Difficulty */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold text-slate-500">追加先セット</label>
        <select
          value={setId ?? ""}
          onChange={(e) => setSetId(e.target.value ? Number(e.target.value) : null)}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
        >
          <option value="">未割り当て</option>
          {sets.map((s) => (
            <option key={s.id} value={s.id}>{s.category} / {s.name}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-3">
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-xs font-bold text-slate-500">カテゴリ</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
          >
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-xs font-bold text-slate-500">難易度</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
          >
            {Object.entries(DIFFICULTY_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Question text */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold text-slate-500">問題文</label>
        <textarea
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          rows={3}
          placeholder={
            type === "fill_blank" ? "空欄は ___ で表してください" :
            type === "ordering" ? "〜を正しい順番に並べてください。" :
            type === "matching" ? "〜を正しく組み合わせてください。" : "問題文を入力"
          }
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 resize-none"
        />
      </div>

      {/* 4択 */}
      {type === "multiple_choice" && (
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-500">選択肢</label>
          {mcChoices.map((text, i) => (
            <div key={i} className="flex gap-2 items-center">
              <span className="text-xs font-black text-slate-500 w-5 text-center">{LABELS[i]}</span>
              <input
                value={text}
                onChange={(e) => { const n = [...mcChoices]; n[i] = e.target.value; setMcChoices(n); }}
                placeholder={`選択肢 ${LABELS[i]}`}
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
              />
            </div>
          ))}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-bold text-slate-500">正解：</span>
            <select value={mcAnswer} onChange={(e) => setMcAnswer(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
              {["A", "B", "C", "D"].map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* ○× */}
      {type === "true_false" && (
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            {TRUE_FALSE_CHOICES.map((c) => (
              <span key={c.label} className="text-sm font-bold bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-slate-700">
                {c.label}: {c.text}
              </span>
            ))}
          </div>
          <span className="text-xs text-slate-400">正解：</span>
          <select value={tfAnswer} onChange={(e) => setTfAnswer(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
            <option value="A">A（○）</option>
            <option value="B">B（×）</option>
          </select>
        </div>
      )}

      {/* 穴埋め */}
      {type === "fill_blank" && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 shrink-0">正解：</span>
          <input value={fbAnswer} onChange={(e) => setFbAnswer(e.target.value)}
            placeholder="空欄に入る正解テキスト"
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none" />
        </div>
      )}

      {/* 並べ替え */}
      {type === "ordering" && (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-500">正しい順番で入力（上が1番目）</label>
          {orderItems.map((text, i) => (
            <div key={i} className="flex gap-2 items-center">
              <span className="text-xs font-black text-slate-400 w-5 text-center">{i + 1}</span>
              <input value={text} onChange={(e) => { const n = [...orderItems]; n[i] = e.target.value; setOrderItems(n); }}
                placeholder={`${i + 1}番目の項目`}
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none" />
            </div>
          ))}
          <div className="flex gap-2 mt-1">
            {orderItems.length < 6 && (
              <button onClick={() => setOrderItems((p) => [...p, ""])}
                className="text-xs text-slate-500 border border-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-50">＋ 追加</button>
            )}
            {orderItems.length > 2 && (
              <button onClick={() => setOrderItems((p) => p.slice(0, -1))}
                className="text-xs text-red-400 border border-red-100 px-2.5 py-1.5 rounded-lg hover:bg-red-50">－ 削除</button>
            )}
          </div>
        </div>
      )}

      {/* 関連付け */}
      {type === "matching" && (
        <div className="flex flex-col gap-1.5">
          <div className="grid grid-cols-2 gap-2 mb-0.5">
            <p className="text-xs font-bold text-slate-400">左側</p>
            <p className="text-xs font-bold text-slate-400">右側（対応）</p>
          </div>
          {matchRows.map((row, i) => (
            <div key={i} className="grid grid-cols-2 gap-2">
              <input value={row.left} onChange={(e) => { const n = [...matchRows]; n[i] = { ...n[i], left: e.target.value }; setMatchRows(n); }}
                placeholder={`左${i + 1}`}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none" />
              <input value={row.right} onChange={(e) => { const n = [...matchRows]; n[i] = { ...n[i], right: e.target.value }; setMatchRows(n); }}
                placeholder={`右${i + 1}`}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none" />
            </div>
          ))}
          <div className="flex gap-2 mt-1">
            {matchRows.length < 5 && (
              <button onClick={() => setMatchRows((p) => [...p, { left: "", right: "" }])}
                className="text-xs text-slate-500 border border-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-50">＋ ペア追加</button>
            )}
            {matchRows.length > 2 && (
              <button onClick={() => setMatchRows((p) => p.slice(0, -1))}
                className="text-xs text-red-400 border border-red-100 px-2.5 py-1.5 rounded-lg hover:bg-red-50">－ 削除</button>
            )}
          </div>
        </div>
      )}

      {/* Explanation */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold text-slate-500">解説</label>
        <textarea
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          rows={2}
          placeholder="解説を入力"
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none resize-none"
        />
      </div>

      {msg && (
        <p className={`text-sm px-3 py-2 rounded-xl ${msg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
          {msg.text}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={saving || !buildPayload()}
        className="py-3 bg-slate-800 text-white rounded-xl text-sm font-bold disabled:opacity-50 active:scale-95 transition-all"
      >
        {saving ? "追加中..." : "＋ 問題を追加"}
      </button>
    </div>
  );
}

// ── Stats Pane ───────────────────────────────────────────────────────────────

function StatsPane({ sets }: { sets: QuestionSet[] }) {
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/questions?admin=true").then((r) => r.json()).then((data) => {
      setAllQuestions(data);
      setLoading(false);
    });
  }, []);

  const total = allQuestions.length;

  const byCat = CATEGORIES.map((cat) => ({
    cat,
    count: allQuestions.filter((q) => q.category === cat).length,
  }));

  const byDiff = Object.entries(DIFFICULTY_LABELS).map(([v, l]) => ({
    label: l,
    count: allQuestions.filter((q) => q.difficulty === v).length,
  }));

  const byType = Object.entries(TYPE_LABELS).map(([v, { label }]) => ({
    label,
    count: allQuestions.filter((q) => q.type === v).length,
  }));

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-slate-800 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  function Bar({ count, max, color }: { count: number; max: number; color: string }) {
    const pct = max > 0 ? (count / max) * 100 : 0;
    return (
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    );
  }

  const maxCat = Math.max(...byCat.map((x) => x.count), 1);

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-slate-800 text-white rounded-2xl p-5 text-center">
        <p className="text-4xl font-black">{total}</p>
        <p className="text-sm text-slate-400 mt-1">総問題数</p>
        <p className="text-xs text-slate-500 mt-0.5">{sets.length} セット</p>
      </div>

      <div>
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-wide mb-3">カテゴリ別</h3>
        <div className="flex flex-col gap-2">
          {byCat.map(({ cat, count }) => (
            <div key={cat} className="flex items-center gap-3">
              <span className="text-xs text-slate-600 w-28 shrink-0">{cat}</span>
              <Bar count={count} max={maxCat} color="bg-slate-600" />
              <span className="text-xs font-bold text-slate-500 w-8 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-wide mb-3">難易度別</h3>
        <div className="flex gap-3">
          {byDiff.map(({ label, count }) => (
            <div key={label} className="flex-1 bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
              <p className="text-xl font-black text-slate-800">{count}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-wide mb-3">出題タイプ別</h3>
        <div className="flex flex-col gap-2">
          {byType.map(({ label, count }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="text-xs text-slate-600 w-20 shrink-0">{label}</span>
              <Bar count={count} max={Math.max(...byType.map((x) => x.count), 1)} color="bg-blue-400" />
              <span className="text-xs font-bold text-slate-500 w-8 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── EditorPane (main export) ─────────────────────────────────────────────────

export function EditorPane({
  selectedQuestion, selectedSetId, sets, onQuestionSaved, onQuestionUpdated, onMoveQuestion,
}: Props) {
  const [tab, setTab] = useState<EditorTab>("edit");

  const TABS: { id: EditorTab; label: string }[] = [
    { id: "edit", label: "問題エディタ" },
    { id: "add", label: "手動追加" },
    { id: "stats", label: "進捗管理" },
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Tab bar */}
      <div className="flex shrink-0 border-b border-slate-200 bg-white">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors ${
              tab === t.id
                ? "border-slate-800 text-slate-800"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-6">
        {tab === "edit" && (
          selectedQuestion ? (
            <EditForm
              question={selectedQuestion}
              sets={sets}
              selectedSetId={selectedSetId}
              onSaved={onQuestionSaved}
              onUpdated={onQuestionUpdated}
              onMove={onMoveQuestion}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 py-16">
              <p className="text-5xl mb-4">✏️</p>
              <p className="text-sm">左のツリーから問題を選択してください</p>
            </div>
          )
        )}

        {tab === "add" && (
          <ManualAddForm
            selectedSetId={selectedSetId}
            sets={sets}
            onSaved={onQuestionSaved}
          />
        )}

        {tab === "stats" && (
          <StatsPane sets={sets} />
        )}
      </div>
    </div>
  );
}
