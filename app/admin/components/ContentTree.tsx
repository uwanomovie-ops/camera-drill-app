"use client";

import { useState, useRef, useEffect } from "react";
import { Question, QuestionSet, CATEGORIES, TYPE_LABELS } from "./types";

type Props = {
  sets: QuestionSet[];
  questions: Question[];
  selectedSetId: number | null;
  selectedQuestionId: number | null;
  onSelectSet: (id: number) => void;
  onSelectQuestion: (q: Question) => void;
  onAddSet: (category: string, name: string) => void;
  onRenameSet: (id: number, name: string) => void;
  onDeleteSet: (id: number, name: string) => void;
};

export function ContentTree({
  sets, questions, selectedSetId, selectedQuestionId,
  onSelectSet, onSelectQuestion, onAddSet, onRenameSet, onDeleteSet,
}: Props) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(CATEGORIES)
  );
  const [editingSetId, setEditingSetId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  // インライン追加入力
  const [addingCategory, setAddingCategory] = useState<string | null>(null);
  const [addingName, setAddingName] = useState("");
  const addInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (addingCategory) addInputRef.current?.focus();
  }, [addingCategory]);

  function toggleCategory(cat: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  function commitRename(id: number) {
    if (editingName.trim()) onRenameSet(id, editingName.trim());
    setEditingSetId(null);
  }

  function startAdding(cat: string) {
    setAddingCategory(cat);
    setAddingName("");
    // カテゴリを開く
    setExpandedCategories((prev) => new Set([...prev, cat]));
  }

  function commitAdd() {
    if (addingCategory && addingName.trim()) {
      onAddSet(addingCategory, addingName.trim());
    }
    setAddingCategory(null);
    setAddingName("");
  }

  function cancelAdd() {
    setAddingCategory(null);
    setAddingName("");
  }

  return (
    <div className="h-full overflow-y-auto bg-slate-900 text-white flex flex-col">
      <div className="px-3 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">
        CONTENT
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {CATEGORIES.map((cat) => {
          const categorySets = sets.filter((s) => s.category === cat);
          const isExpanded = expandedCategories.has(cat);

          return (
            <div key={cat}>
              <button
                onClick={() => toggleCategory(cat)}
                className="w-full flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-slate-300 hover:bg-slate-800 transition-colors"
              >
                <span className={`text-slate-600 text-[8px] transition-transform duration-150 ${isExpanded ? "rotate-90" : ""}`}>
                  ▶
                </span>
                {cat}
                <span className="ml-auto text-[10px] text-slate-600">{categorySets.reduce((s, set) => s + set.questionCount, 0)}</span>
              </button>

              {isExpanded && (
                <div className="ml-2 mb-1">
                  {categorySets.map((set) => {
                    const isSelected = selectedSetId === set.id;
                    const isEditingThis = editingSetId === set.id;

                    return (
                      <div key={set.id}>
                        <div
                          className={`flex items-center gap-1 px-2 py-1.5 rounded-lg mx-1 mb-0.5 cursor-pointer group ${
                            isSelected ? "bg-slate-700" : "hover:bg-slate-800"
                          }`}
                          onClick={() => !isEditingThis && onSelectSet(set.id)}
                        >
                          {isEditingThis ? (
                            <input
                              autoFocus
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onBlur={() => commitRename(set.id)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") commitRename(set.id);
                                else if (e.key === "Escape") setEditingSetId(null);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="flex-1 bg-slate-600 text-white text-[11px] px-1.5 py-0.5 rounded border border-slate-400 focus:outline-none"
                            />
                          ) : (
                            <>
                              <span className="text-[10px] text-slate-500">▸</span>
                              <span className="flex-1 text-[11px] text-slate-200 truncate">{set.name}</span>
                              <span className="text-[9px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded-full shrink-0">
                                {set.questionCount}問
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingSetId(set.id);
                                  setEditingName(set.name);
                                }}
                                className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-slate-300 text-xs ml-0.5 transition-opacity"
                                title="名前を変更"
                              >
                                ✎
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteSet(set.id, set.name);
                                }}
                                className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-300 text-xs ml-0.5 transition-opacity"
                                title="セットを削除"
                              >
                                ✕
                              </button>
                            </>
                          )}
                        </div>

                        {isSelected && questions.length > 0 && (
                          <div className="ml-4 mb-1">
                            {questions.map((q) => (
                              <button
                                key={q.id}
                                onClick={() => onSelectQuestion(q)}
                                className={`w-full text-left px-2 py-1 rounded-lg transition-colors ${
                                  selectedQuestionId === q.id
                                    ? "bg-slate-600 text-white"
                                    : "text-slate-500 hover:bg-slate-800 hover:text-slate-300"
                                }`}
                              >
                                <span className={`text-[9px] font-bold mr-1 px-1 py-0.5 rounded ${TYPE_LABELS[q.type]?.className ?? ""}`}>
                                  {TYPE_LABELS[q.type]?.label}
                                </span>
                                {!q.published && (
                                  <span className="text-[9px] font-bold mr-1 px-1 py-0.5 rounded bg-amber-900 text-amber-400">
                                    下書き
                                  </span>
                                )}
                                <span className="text-[10px]">
                                  {q.question.length > 20 ? q.question.slice(0, 20) + "…" : q.question}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* インライン セット追加 */}
                  {addingCategory === cat ? (
                    <div className="flex items-center gap-1 px-2 py-1 mx-0.5">
                      <input
                        ref={addInputRef}
                        value={addingName}
                        onChange={(e) => setAddingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitAdd();
                          else if (e.key === "Escape") cancelAdd();
                        }}
                        placeholder="セット名を入力…"
                        className="flex-1 bg-slate-700 text-white text-[11px] px-2 py-1 rounded border border-slate-500 focus:outline-none focus:border-slate-300 placeholder:text-slate-500"
                      />
                      <button
                        onClick={commitAdd}
                        disabled={!addingName.trim()}
                        className="text-[10px] text-green-400 hover:text-green-200 font-bold disabled:opacity-30 px-1"
                      >
                        ✓
                      </button>
                      <button
                        onClick={cancelAdd}
                        className="text-[10px] text-slate-500 hover:text-slate-300 px-1"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startAdding(cat)}
                      className="w-full flex items-center gap-1 px-3 py-1 text-[10px] text-slate-600 hover:text-slate-400 hover:bg-slate-800 rounded-lg transition-colors mx-0.5"
                    >
                      ＋ セット追加
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
