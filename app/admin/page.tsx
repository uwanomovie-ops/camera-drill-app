"use client";

import { useState, useEffect, useCallback } from "react";

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

type Draft = Omit<Question, "id" | "type"> & { type?: string };

const CATEGORIES = ["露出", "レンズ", "構図", "ライティング", "カメラの仕組み"];
const DIFFICULTIES = [
  { value: "easy", label: "やさしい" },
  { value: "medium", label: "ふつう" },
  { value: "hard", label: "むずかしい" },
];

function DifficultyBadge({ value }: { value: string }) {
  const map: Record<string, string> = {
    easy: "bg-green-100 text-green-700",
    medium: "bg-yellow-100 text-yellow-700",
    hard: "bg-red-100 text-red-700",
  };
  const label: Record<string, string> = { easy: "やさしい", medium: "ふつう", hard: "むずかしい" };
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${map[value] ?? "bg-slate-100 text-slate-600"}`}>
      {label[value] ?? value}
    </span>
  );
}

export default function AdminPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Question>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genCategory, setGenCategory] = useState(CATEGORIES[0]);
  const [genDifficulty, setGenDifficulty] = useState("medium");
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/questions");
    const data = await res.json();
    setQuestions(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  function showMsg(type: "success" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  }

  async function handleDelete(id: number) {
    if (!confirm("この問題を削除しますか？")) return;
    await fetch(`/api/questions/${id}`, { method: "DELETE" });
    showMsg("success", "削除しました");
    fetchQuestions();
  }

  async function handleUpdate(id: number) {
    setSaving(true);
    const res = await fetch(`/api/questions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    setSaving(false);
    if (res.ok) {
      showMsg("success", "更新しました");
      setEditingId(null);
      fetchQuestions();
    } else {
      showMsg("error", "更新に失敗しました");
    }
  }

  async function handleSaveDraft() {
    if (!draft) return;
    setSaving(true);
    const res = await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...draft, type: "multiple_choice" }),
    });
    setSaving(false);
    if (res.ok) {
      showMsg("success", "問題を追加しました");
      setDraft(null);
      setFeedback("");
      fetchQuestions();
    } else {
      showMsg("error", "追加に失敗しました");
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    setDraft(null);
    const res = await fetch("/api/admin/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: genCategory,
        difficulty: genDifficulty,
        feedback: feedback || undefined,
      }),
    });
    setGenerating(false);
    if (res.ok) {
      const data = await res.json();
      setDraft(data);
      setFeedback("");
    } else {
      const err = await res.json();
      showMsg("error", err.error ?? "生成に失敗しました");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black">📷 Quiz Studio</h1>
          <p className="text-xs text-slate-400">カメラドリル 管理画面</p>
        </div>
        <a href="/" className="text-xs text-slate-400 hover:text-white transition-colors">
          ← アプリに戻る
        </a>
      </div>

      {/* Toast */}
      {message && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-bold shadow-lg ${
          message.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
        }`}>
          {message.text}
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-8">
        {/* AI Generate Section */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-2xl">✨</span>
            <h2 className="text-base font-black text-slate-800">AIで問題を生成</h2>
          </div>

          <div className="flex flex-wrap gap-3 mb-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500">カテゴリ</label>
              <select
                value={genCategory}
                onChange={(e) => setGenCategory(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-slate-800"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500">難易度</label>
              <select
                value={genDifficulty}
                onChange={(e) => setGenDifficulty(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-slate-800"
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
          </div>

          {draft && (
            <div className="mb-4">
              <label className="text-xs font-bold text-slate-500 block mb-1">
                修正フィードバック（任意）
              </label>
              <input
                type="text"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="例：もっとやさしい表現にして / 選択肢をわかりやすく"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-800"
              />
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-5 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-bold active:scale-95 transition-all disabled:opacity-50"
          >
            {generating ? "生成中..." : draft ? "再生成する" : "AIで生成する"}
          </button>

          {/* Draft preview */}
          {draft && (
            <div className="mt-5 border border-slate-200 rounded-2xl p-5 bg-slate-50">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold text-slate-500">草案プレビュー</span>
                <DifficultyBadge value={draft.difficulty} />
                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  {draft.category}
                </span>
              </div>
              <p className="text-sm font-bold text-slate-800 mb-3">{draft.question}</p>
              <div className="flex flex-col gap-1.5 mb-3">
                {draft.choices.map((c) => (
                  <div key={c.label} className={`flex gap-2 text-sm p-2 rounded-lg ${c.label === draft.answer ? "bg-green-50 border border-green-200" : "bg-white border border-slate-100"}`}>
                    <span className={`font-black w-5 shrink-0 ${c.label === draft.answer ? "text-green-600" : "text-slate-400"}`}>{c.label}</span>
                    <span className="text-slate-700">{c.text}</span>
                    {c.label === draft.answer && <span className="ml-auto text-green-600 text-xs font-bold">正解</span>}
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-600 bg-white border border-slate-100 rounded-xl p-3 leading-relaxed">
                💡 {draft.explanation}
              </p>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleSaveDraft}
                  disabled={saving}
                  className="flex-1 py-2.5 bg-green-500 text-white rounded-xl text-sm font-bold active:scale-95 transition-all disabled:opacity-50"
                >
                  {saving ? "保存中..." : "✓ 採用して保存"}
                </button>
                <button
                  onClick={() => { setDraft(null); setFeedback(""); }}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 active:scale-95 transition-all"
                >
                  破棄
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Question List */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-black text-slate-800">
              問題一覧
              <span className="ml-2 text-sm font-normal text-slate-400">{questions.length}問</span>
            </h2>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold active:scale-95 transition-all"
            >
              ＋ 手動で追加
            </button>
          </div>

          {/* Manual add form */}
          {showAddForm && (
            <ManualAddForm
              onSave={async (data) => {
                setSaving(true);
                const res = await fetch("/api/questions", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ ...data, type: "multiple_choice" }),
                });
                setSaving(false);
                if (res.ok) {
                  showMsg("success", "追加しました");
                  setShowAddForm(false);
                  fetchQuestions();
                }
              }}
              onCancel={() => setShowAddForm(false)}
              saving={saving}
            />
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-slate-800 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {questions.map((q) => (
                <div key={q.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                  {editingId === q.id ? (
                    <EditForm
                      question={q}
                      form={editForm}
                      onChange={setEditForm}
                      onSave={() => handleUpdate(q.id)}
                      onCancel={() => setEditingId(null)}
                      saving={saving}
                    />
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-400">#{q.id}</span>
                          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{q.category}</span>
                          <DifficultyBadge value={q.difficulty} />
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => { setEditingId(q.id); setEditForm(q); }}
                            className="text-xs font-bold text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg active:scale-95 transition-all hover:bg-slate-50"
                          >
                            編集
                          </button>
                          <button
                            onClick={() => handleDelete(q.id)}
                            className="text-xs font-bold text-red-500 border border-red-100 px-3 py-1.5 rounded-lg active:scale-95 transition-all hover:bg-red-50"
                          >
                            削除
                          </button>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-slate-800 mb-2">{q.question}</p>
                      <div className="flex flex-col gap-1">
                        {q.choices.map((c) => (
                          <p key={c.label} className={`text-xs ${c.label === q.answer ? "text-green-600 font-bold" : "text-slate-400"}`}>
                            {c.label}. {c.text} {c.label === q.answer && "✓"}
                          </p>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function EditForm({
  question,
  form,
  onChange,
  onSave,
  onCancel,
  saving,
}: {
  question: Question;
  form: Partial<Question>;
  onChange: (f: Partial<Question>) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <select
          value={form.category ?? question.category}
          onChange={(e) => onChange({ ...form, category: e.target.value })}
          className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none"
        >
          {["露出", "レンズ", "構図", "ライティング", "カメラの仕組み"].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={form.difficulty ?? question.difficulty}
          onChange={(e) => onChange({ ...form, difficulty: e.target.value })}
          className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none"
        >
          <option value="easy">やさしい</option>
          <option value="medium">ふつう</option>
          <option value="hard">むずかしい</option>
        </select>
      </div>
      <textarea
        value={form.question ?? question.question}
        onChange={(e) => onChange({ ...form, question: e.target.value })}
        rows={2}
        className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-800 resize-none"
      />
      {(form.choices ?? question.choices).map((c, i) => (
        <div key={c.label} className="flex gap-2 items-center">
          <span className="text-xs font-black text-slate-500 w-4">{c.label}</span>
          <input
            value={c.text}
            onChange={(e) => {
              const newChoices = [...(form.choices ?? question.choices)];
              newChoices[i] = { ...newChoices[i], text: e.target.value };
              onChange({ ...form, choices: newChoices });
            }}
            className="flex-1 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:outline-none"
          />
        </div>
      ))}
      <div className="flex gap-2 items-center">
        <span className="text-xs font-bold text-slate-500">正解：</span>
        <select
          value={form.answer ?? question.answer}
          onChange={(e) => onChange({ ...form, answer: e.target.value })}
          className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold focus:outline-none"
        >
          {["A", "B", "C", "D"].map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>
      <textarea
        value={form.explanation ?? question.explanation}
        onChange={(e) => onChange({ ...form, explanation: e.target.value })}
        rows={2}
        placeholder="解説"
        className="border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none resize-none"
      />
      <div className="flex gap-2">
        <button
          onClick={onSave}
          disabled={saving}
          className="flex-1 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold disabled:opacity-50"
        >
          {saving ? "保存中..." : "保存"}
        </button>
        <button onClick={onCancel} className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600">
          キャンセル
        </button>
      </div>
    </div>
  );
}

function ManualAddForm({
  onSave,
  onCancel,
  saving,
}: {
  onSave: (data: Omit<Question, "id" | "type">) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState({
    category: "露出",
    question: "",
    choices: [
      { label: "A", text: "" },
      { label: "B", text: "" },
      { label: "C", text: "" },
      { label: "D", text: "" },
    ],
    answer: "A",
    explanation: "",
    difficulty: "medium",
  });

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-dashed border-slate-300 mb-3">
      <p className="text-xs font-black text-slate-500 mb-3">新規問題</p>
      <div className="flex gap-2 mb-3">
        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold focus:outline-none"
        >
          {["露出", "レンズ", "構図", "ライティング", "カメラの仕組み"].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={form.difficulty}
          onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
          className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold focus:outline-none"
        >
          <option value="easy">やさしい</option>
          <option value="medium">ふつう</option>
          <option value="hard">むずかしい</option>
        </select>
      </div>
      <textarea
        value={form.question}
        onChange={(e) => setForm({ ...form, question: e.target.value })}
        rows={2}
        placeholder="問題文"
        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none mb-2 resize-none"
      />
      {form.choices.map((c, i) => (
        <div key={c.label} className="flex gap-2 items-center mb-1.5">
          <span className="text-xs font-black text-slate-500 w-4">{c.label}</span>
          <input
            value={c.text}
            onChange={(e) => {
              const nc = [...form.choices];
              nc[i] = { ...nc[i], text: e.target.value };
              setForm({ ...form, choices: nc });
            }}
            placeholder={`選択肢 ${c.label}`}
            className="flex-1 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:outline-none"
          />
        </div>
      ))}
      <div className="flex gap-2 items-center mb-2">
        <span className="text-xs font-bold text-slate-500">正解：</span>
        <select
          value={form.answer}
          onChange={(e) => setForm({ ...form, answer: e.target.value })}
          className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold focus:outline-none"
        >
          {["A", "B", "C", "D"].map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>
      <textarea
        value={form.explanation}
        onChange={(e) => setForm({ ...form, explanation: e.target.value })}
        rows={2}
        placeholder="解説"
        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none resize-none mb-3"
      />
      <div className="flex gap-2">
        <button
          onClick={() => onSave(form)}
          disabled={saving || !form.question}
          className="flex-1 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold disabled:opacity-50"
        >
          {saving ? "保存中..." : "追加"}
        </button>
        <button onClick={onCancel} className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600">
          キャンセル
        </button>
      </div>
    </div>
  );
}
