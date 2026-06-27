"use client";

import { useState, useEffect, useCallback } from "react";
import { Question, QuestionSet } from "./components/types";
import { ContentTree } from "./components/ContentTree";
import { EditorPane } from "./components/EditorPane";
import { QuestionPreview } from "./components/QuestionPreview";
import { AgentsBar } from "./components/AgentsBar";

// ── Password Gate ────────────────────────────────────────────────────────────

function PasswordGate({ onAuth }: { onAuth: () => void }) {
  const [password, setPassword] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setChecking(true);
    setError("");
    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setChecking(false);
    if (res.ok) {
      sessionStorage.setItem("quiz_studio_authed", "1");
      onAuth();
    } else {
      setError("パスワードが違います");
      setPassword("");
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-6">
      <div className="w-full max-w-xs">
        <div className="text-center mb-8">
          <p className="text-4xl mb-3">📷</p>
          <h1 className="text-lg font-black text-white">カメラドリルスタジオ</h1>
          <p className="text-xs text-slate-400 mt-1">管理画面にアクセスするにはパスワードが必要です</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="パスワードを入力"
            autoFocus
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
          {error && <p className="text-red-400 text-xs text-center">{error}</p>}
          <button
            type="submit"
            disabled={checking || !password}
            className="w-full py-3 bg-white text-slate-900 rounded-xl text-sm font-bold active:scale-95 transition-all disabled:opacity-40"
          >
            {checking ? "確認中..." : "入る →"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [sets, setSets] = useState<QuestionSet[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<number | null>(null);
  const [setQuestions, setSetQuestions] = useState<Question[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

  const fetchSets = useCallback(async () => {
    const res = await fetch("/api/sets");
    const data = await res.json();
    setSets(data);
  }, []);

  const fetchSetQuestions = useCallback(async (setId: number) => {
    const res = await fetch(`/api/sets/${setId}/questions`);
    const data = await res.json();
    setSetQuestions(data);
  }, []);

  function handleSelectSet(id: number) {
    setSelectedSetId(id);
    setSelectedQuestion(null);
    fetchSetQuestions(id);
  }

  async function handleAddSet(category: string, name: string) {
    await fetch("/api/sets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, category }),
    });
    fetchSets();
  }

  async function handleRenameSet(id: number, name: string) {
    await fetch(`/api/sets/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    fetchSets();
  }

  async function handleDeleteSet(id: number, name: string) {
    if (!confirm(`「${name}」を削除しますか？\n（セット内の問題は削除されず「未割り当て」になります）`)) return;
    await fetch(`/api/sets/${id}`, { method: "DELETE" });
    if (selectedSetId === id) {
      setSelectedSetId(null);
      setSetQuestions([]);
      setSelectedQuestion(null);
    }
    fetchSets();
  }

  function handleQuestionSaved() {
    fetchSets();
    if (selectedSetId) fetchSetQuestions(selectedSetId);
  }

  function handleQuestionUpdated(q: Question) {
    setSelectedQuestion(q);
    setSetQuestions((prev) => prev.map((p) => (p.id === q.id ? q : p)));
  }

  async function handleMoveQuestion(id: number, direction: "up" | "down") {
    await fetch(`/api/questions/${id}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ direction }),
    });
    if (selectedSetId) fetchSetQuestions(selectedSetId);
  }

  useEffect(() => {
    const ok = sessionStorage.getItem("quiz_studio_authed") === "1";
    setAuthed(ok);
  }, []);

  useEffect(() => {
    if (authed) fetchSets();
  }, [authed, fetchSets]);

  if (authed === null) return null;
  if (!authed) return <PasswordGate onAuth={() => { setAuthed(true); fetchSets(); }} />;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-50">
      {/* Header */}
      <div className="h-14 shrink-0 bg-slate-900 text-white flex items-center justify-between px-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="text-xl">📷</span>
          <div>
            <span className="text-sm font-black tracking-tight">カメラドリルスタジオ</span>
            <span className="ml-2 text-[10px] text-slate-500 border border-slate-700 px-1.5 py-0.5 rounded">Studio</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <a href="/" className="text-xs text-slate-400 hover:text-white transition-colors">
            ← アプリに戻る
          </a>
          <button
            onClick={() => { sessionStorage.removeItem("quiz_studio_authed"); setAuthed(false); }}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            ログアウト
          </button>
        </div>
      </div>

      {/* 4-pane body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Content Tree (w-56) */}
        <div className="w-56 shrink-0 border-r border-slate-800 overflow-hidden">
          <ContentTree
            sets={sets}
            questions={setQuestions}
            selectedSetId={selectedSetId}
            selectedQuestionId={selectedQuestion?.id ?? null}
            onSelectSet={handleSelectSet}
            onSelectQuestion={setSelectedQuestion}
            onAddSet={handleAddSet}
            onRenameSet={handleRenameSet}
            onDeleteSet={handleDeleteSet}
          />
        </div>

        {/* Center: Editor Pane (flex-1) */}
        <div className="flex-1 overflow-hidden">
          <EditorPane
            selectedQuestion={selectedQuestion}
            selectedSetId={selectedSetId}
            sets={sets}
            onQuestionSaved={handleQuestionSaved}
            onQuestionUpdated={handleQuestionUpdated}
            onMoveQuestion={handleMoveQuestion}
          />
        </div>

        {/* Right: Preview + Agents Bar (w-72, split 50/50) */}
        <div className="w-72 shrink-0 border-l border-slate-200 flex flex-col overflow-hidden">
          <div className="h-1/2 overflow-hidden border-b border-slate-200">
            <QuestionPreview question={selectedQuestion} />
          </div>
          <div className="h-1/2 overflow-hidden">
            <AgentsBar
              selectedQuestion={selectedQuestion}
              selectedSetId={selectedSetId}
              sets={sets}
              onQuestionSaved={handleQuestionSaved}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
