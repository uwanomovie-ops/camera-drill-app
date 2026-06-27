import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY が設定されていません" }, { status: 500 });
  }

  const body = await request.json();
  const { mode, question, message } = body;

  let prompt = "";

  if (mode === "review" && question) {
    prompt = `あなたはカメラ・写真教育の専門家です。以下のクイズ問題を品質レビューしてください。

【問題情報】
カテゴリ: ${question.category}
難易度: ${question.difficulty}
タイプ: ${question.type}
問題文: ${question.question}
選択肢: ${JSON.stringify(question.choices, null, 2)}
正解: ${question.answer}
解説: ${question.explanation}

以下の観点でレビューし、日本語で回答してください：
1. 問題文の明確さ・わかりやすさ
2. 選択肢の適切さ（難易度のバランス）
3. 解説の正確さと学習効果
4. 改善点があれば具体的に提案

簡潔に箇条書きでまとめてください。`;
  } else if (mode === "free" && message) {
    prompt = `あなたはカメラ・写真技術の教育専門家です。以下の質問に日本語で答えてください。

${message}

簡潔でわかりやすい回答をしてください。`;
  } else {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    return NextResponse.json({ error: `Gemini APIエラー: ${err}` }, { status: 500 });
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "回答を取得できませんでした";

  return NextResponse.json({ text });
}
