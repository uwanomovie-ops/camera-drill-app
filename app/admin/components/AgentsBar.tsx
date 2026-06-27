"use client";

import { useState } from "react";
import { Question, QuestionSet, CATEGORIES, DIFFICULTY_LABELS } from "./types";

type Tab = "generate" | "review" | "chat";

type Draft = {
  question: string;
  choices: { label: string; text: string }[];
  answer: string;
  explanation: string;
  category: string;
  difficulty: string;
  type: string;
};

type Props = {
  selectedQuestion: Question | null;
  selectedSetId: number | null;
  sets: QuestionSet[];
  onQuestionSaved: () => void;
};

const TYPES = [
  { value: "multiple_choice", label: "4択" },
  { value: "true_false", label: "○×" },
  { value: "fill_blank", label: "穴埋め" },
  { value: "ordering", label: "並べ替え" },
  { value: "matching", label: "関連付け" },
];

export function AgentsBar({ selectedQuestion, selectedSetId, sets, onQuestionSaved }: Props) {
  const [tab, setTab] = useState<Tab>("generate");

  const [genCategory, setGenCategory] = useState<string>(CATEGORIES[0]);
  const [genDifficulty, setGenDifficulty] = useState("medium");
  const [genType, setGenType] = useState("multiple_choice");
  const [feedback, setFeedback] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [genMsg, setGenMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [reviewing, setReviewing] = useState(false);
  const [reviewResult, setReviewResult] = useState<string | null>(null);

  const [chatInput, setChatInput] = useState("");
  const [chatting, setChatting] = useState(false);
  const [chatResult, setChatResult] = useState<string | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    setDraft(null);
    setGenMsg(null);
    const res = await fetch("/api/admin/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: genCategory, difficulty: genDifficulty, type: genType, feedback: feedback || undefined }),
    });
    setGenerating(false);
    if (res.ok) {
      setDraft(await res.json());
      setFeedback("");
    } else {
      const err = await res.json();
      setGenMsg({ type: "error", text: err.error ?? "生成に失敗しました" });
    }
  }

  async function handleSaveDraft() {
    if (!draft) return;
    setSaving(true);
    const res = await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // published はデフォルト false（下書き）のままサーバー側に任せる
      body: JSON.stringify({ ...draft, setId: selectedSetId ?? null }),
    });
    setSaving(false);
    if (res.ok) {
      const saved = await res.json();
      setGenMsg({
        type: "success",
        text: selectedSetId
          ? `下書きとして保存しました（#${saved.id}）。エディタで「公開する」を押すとドリルに追加されます。`
          : `下書きとして保存しました（#${saved.id}）。セットを選択して問題エディタから公開できます。`,
      });
      setDraft(null);
      setFeedback("");
      onQuestionSaved();
    } else {
      setGenMsg({ type: "error", text: "保存に失敗しました" });
    }
  }

  async function handleReview() {
    if (!selectedQuestion) return;
    setReviewing(true);
    setReviewResult(null);
    const res = await fetch("/api/admin/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "review", question: selectedQuestion }),
    });
    setReviewing(false);
    setReviewResult(res.ok ? (await res.json()).text : "レビューに失敗しました");
  }

  async function handleChat() {
    if (!chatInput.trim()) return;
    setChatting(true);
    setChatResult(null);
    const res = await fetch("/api/admin/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "free", message: chatInput }),
    });
    setChatting(false);
    setChatResult(res.ok ? (await res.json()).text : "回答を取得できませんでした");
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: "generate", label: "クイズ作成" },
    { id: "review", label: "品質チェック" },
    { id: "chat", label: "フリーチャット" },
  ];

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex shrink-0 border-b border-slate-200 bg-slate-50">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 text-[10px] font-bold border-b-2 transition-colors ${
              tab === t.id
                ? "border-slate-800 text-slate-800 bg-white"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {tab === "generate" && (
          <div className="flex flex-col gap-2">
            <p className={`text-[10px] px-2 py-1 rounded-lg border ${
              selectedSetId
                ? "text-blue-700 bg-blue-50 border-blue-100"
                : "text-amber-600 bg-amber-50 border-amber-100"
            }`}>
              {selectedSetId
                ? `保存先: ${sets.find((s) => s.id === selectedSetId)?.name ?? "不明"}`
                : "⚠ セット未選択 — 下書きとして保存されます"}
            </p>

            <div className="flex gap-1.5">
              <select
                value={genCategory}
                onChange={(e) => setGenCategory(e.target.value)}
                className="flex-1 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold focus:outline-none min-w-0"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select
                value={genDifficulty}
                onChange={(e) => setGenDifficulty(e.target.value)}
                className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold focus:outline-none"
              >
                {Object.entries(DIFFICULTY_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap gap-1">
              {TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => { setGenType(t.value); setDraft(null); }}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                    genType === t.value
                      ? "bg-slate-800 text-white border-slate-800"
                      : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {draft && (
              <input
                type="text"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="修正フィードバック（任意）"
                className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
              />
            )}

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="py-2 bg-slate-800 text-white rounded-xl text-xs font-bold disabled:opacity-50 active:scale-95 transition-all"
            >
              {generating ? "生成中..." : draft ? "再生成する" : "✨ AIで生成する"}
            </button>

            {genMsg && (
              <p className={`text-xs px-2 py-1.5 rounded-lg ${genMsg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                {genMsg.text}
              </p>
            )}

            {draft && (
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 flex flex-col gap-2">
                <p className="text-xs font-bold text-slate-800 leading-relaxed">{draft.question}</p>
                <div className="flex flex-col gap-1">
                  {draft.choices.map((c) => {
                    const isCorrect = c.label === draft.answer || draft.answer.split(",").some((a) => a === c.label || a.startsWith(c.label + ":"));
                    return (
                      <div
                        key={c.label}
                        className={`flex gap-1.5 text-xs px-2 py-1.5 rounded-lg border ${
                          isCorrect ? "bg-green-50 border-green-200 font-bold text-green-800" : "bg-white border-slate-100 text-slate-600"
                        }`}
                      >
                        <span className="font-black w-3 shrink-0">{c.label}</span>
                        <span>{c.text}</span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed bg-white border border-slate-100 rounded-lg p-2">
                  💡 {draft.explanation}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveDraft}
                    disabled={saving}
                    className="flex-1 py-1.5 bg-green-500 text-white rounded-lg text-xs font-bold disabled:opacity-50 active:scale-95 transition-all"
                  >
                    {saving ? "保存中..." : "✓ 採用して保存"}
                  </button>
                  <button
                    onClick={() => { setDraft(null); setFeedback(""); }}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600"
                  >
                    破棄
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "review" && (
          <div className="flex flex-col gap-3">
            {selectedQuestion ? (
              <>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <p className="text-[10px] text-slate-400 mb-1.5 font-bold">選択中の問題</p>
                  <p className="text-xs font-bold text-slate-800 leading-relaxed line-clamp-3">
                    {selectedQuestion.question}
                  </p>
                </div>
                <button
                  onClick={handleReview}
                  disabled={reviewing}
                  className="py-2 bg-slate-800 text-white rounded-xl text-xs font-bold disabled:opacity-50 active:scale-95 transition-all"
                >
                  {reviewing ? "チェック中..." : "🔍 AIで品質チェック"}
                </button>
                {reviewResult && (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                    <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">{reviewResult}</p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-xs text-slate-400 text-center py-8">問題一覧から問題を選択してください</p>
            )}
          </div>
        )}

        {tab === "chat" && (
          <div className="flex flex-col gap-2">
            <p className="text-[10px] text-slate-400">カメラ・撮影技術について何でも聞けます</p>
            <textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              rows={3}
              placeholder="例：ISO感度を上げるとノイズが増える理由は？"
              className="border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 resize-none"
            />
            <button
              onClick={handleChat}
              disabled={chatting || !chatInput.trim()}
              className="py-2 bg-slate-800 text-white rounded-xl text-xs font-bold disabled:opacity-50 active:scale-95 transition-all"
            >
              {chatting ? "回答中..." : "送信"}
            </button>
            {chatResult && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">{chatResult}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
