"use client";

import { useState } from "react";
import questionsData from "@/src/data/questions.json";

type Question = {
  id: number;
  category: string;
  question: string;
  choices: { label: string; text: string }[];
  answer: string;
  explanation: string;
};

const questions: Question[] = questionsData as Question[];

type Phase = "answering" | "correct" | "incorrect";

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

export default function Home() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("answering");
  const [correctCount, setCorrectCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const question = questions[currentIndex];
  const isLast = currentIndex >= questions.length - 1;
  const feedbackVisible = phase !== "answering";
  const isCorrect = phase === "correct";

  const progress =
    ((currentIndex + (feedbackVisible ? 1 : 0)) / questions.length) * 100;

  function handleSelect(label: string) {
    if (feedbackVisible) return;
    const correct = label === question.answer;
    setSelected(label);
    setPhase(correct ? "correct" : "incorrect");
    if (correct) setCorrectCount((c) => c + 1);
  }

  function handleNext() {
    if (isLast) {
      setIsFinished(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setSelected(null);
      setPhase("answering");
    }
  }

  function handleRestart() {
    setCurrentIndex(0);
    setSelected(null);
    setPhase("answering");
    setCorrectCount(0);
    setIsFinished(false);
  }

  if (isFinished) {
    const percentage = Math.round((correctCount / questions.length) * 100);
    return (
      <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center px-6 gap-8">
        <div className="flex flex-col items-center gap-4">
          <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-200">
            <CheckIcon className="w-12 h-12 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black text-slate-800">レッスン完了！</h1>
            <p className="text-sm text-slate-500 mt-1">カメラ基礎クイズ</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl w-full max-w-xs flex divide-x divide-slate-100 shadow-sm">
          <div className="flex-1 py-6 flex flex-col items-center gap-1">
            <span className="text-3xl font-black text-slate-800">
              {correctCount}/{questions.length}
            </span>
            <span className="text-xs text-slate-500">正解</span>
          </div>
          <div className="flex-1 py-6 flex flex-col items-center gap-1">
            <span className="text-3xl font-black text-pink-500">{percentage}%</span>
            <span className="text-xs text-slate-500">正答率</span>
          </div>
        </div>

        <div className="w-full max-w-xs flex flex-col gap-3">
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

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header */}
      <div className="bg-white px-4 pt-4 pb-3 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <button className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 active:scale-90 transition-all">
            <CloseIcon className="w-4 h-4" />
          </button>
          <div className="text-right">
            <p className="text-[10px] text-slate-400 leading-none mb-0.5">
              📷 カメラドリル
            </p>
            <p className="text-sm font-bold text-slate-700 leading-tight">
              {question.category}
            </p>
          </div>
        </div>
        <div className="h-1 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-slate-800 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="px-4 pt-5 pb-4">
          {/* Q badge */}
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-slate-800 text-white text-sm font-black px-3 py-1 rounded-full">
              Q{currentIndex + 1}
            </span>
            <span className="text-sm text-slate-400">/ {questions.length}問</span>
          </div>

          {/* Question */}
          <h2 className="text-lg font-bold text-slate-800 leading-snug mb-6">
            {question.question}
          </h2>

          {/* Choices */}
          <div className="flex flex-col gap-3">
            {question.choices.map((choice) => {
              const isSelected = selected === choice.label;
              const isAnswered = feedbackVisible;
              const isChoiceCorrect = choice.label === question.answer;

              let cardStyle =
                "border border-slate-200 bg-white shadow-sm";
              let labelStyle = "bg-slate-100 text-slate-600";

              if (isAnswered) {
                if (isChoiceCorrect) {
                  cardStyle = "border border-green-200 bg-green-50 shadow-sm";
                  labelStyle = "bg-green-500 text-white";
                } else if (isSelected) {
                  cardStyle = "border border-red-200 bg-red-50 shadow-sm";
                  labelStyle = "bg-red-400 text-white";
                } else {
                  cardStyle =
                    "border border-slate-100 bg-white shadow-sm opacity-40";
                }
              } else if (isSelected) {
                cardStyle = "border-2 border-slate-800 bg-white shadow-sm";
                labelStyle = "bg-slate-800 text-white";
              }

              const showFilled =
                isSelected || (isAnswered && isChoiceCorrect);
              let radioOuter = "border-2 border-slate-300";
              let radioDot = "bg-slate-800";
              if (isAnswered && isChoiceCorrect) {
                radioOuter = "border-2 border-green-500";
                radioDot = "bg-green-500";
              } else if (isAnswered && isSelected) {
                radioOuter = "border-2 border-red-400";
                radioDot = "bg-red-400";
              } else if (isSelected) {
                radioOuter = "border-2 border-slate-800";
              }

              return (
                <button
                  key={choice.label}
                  disabled={isAnswered}
                  onClick={() => handleSelect(choice.label)}
                  className={`flex items-center gap-3 w-full rounded-2xl px-4 py-4 text-left transition-all active:scale-[0.98] ${cardStyle}`}
                >
                  <span
                    className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shrink-0 ${labelStyle}`}
                  >
                    {isAnswered && isChoiceCorrect ? (
                      <CheckIcon className="w-4 h-4" />
                    ) : (
                      choice.label
                    )}
                  </span>
                  <span className="flex-1 text-sm font-semibold text-slate-700 leading-snug">
                    {choice.text}
                  </span>
                  <span
                    className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center ${radioOuter}`}
                  >
                    {showFilled && (
                      <span className={`w-2.5 h-2.5 rounded-full ${radioDot}`} />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Feedback panel */}
        {feedbackVisible && (
          <div
            className={`px-4 pt-5 pb-8 ${
              isCorrect ? "bg-green-50" : "bg-red-50"
            }`}
          >
            {/* Label row */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                    isCorrect ? "bg-green-500" : "bg-red-400"
                  }`}
                >
                  {isCorrect ? (
                    <CheckIcon className="w-3.5 h-3.5 text-white" />
                  ) : (
                    <CloseIcon className="w-3 h-3 text-white" />
                  )}
                </span>
                <span
                  className={`text-xl font-black ${
                    isCorrect ? "text-green-700" : "text-red-600"
                  }`}
                >
                  {isCorrect ? "正解！" : "不正解..."}
                </span>
              </div>
              <button className="text-slate-400 p-1">
                <FlagIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Explanation card */}
            <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
              <p
                className={`text-xs font-bold mb-2 ${
                  isCorrect ? "text-green-600" : "text-red-500"
                }`}
              >
                マスターのワンポイント
              </p>
              <p className="text-sm text-slate-700 leading-relaxed">
                {question.explanation}
              </p>
            </div>

            {/* Next button */}
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
