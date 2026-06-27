import { NextRequest, NextResponse } from "next/server";

const CATEGORIES = ["露出", "レンズ", "構図", "ライティング", "カメラの仕組み"];
const DIFFICULTIES = { easy: "やさしい", medium: "ふつう", hard: "むずかしい" };

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY が設定されていません" }, { status: 500 });
  }

  const body = await request.json();
  const { category, difficulty, feedback } = body;

  if (!category || !difficulty) {
    return NextResponse.json({ error: "カテゴリと難易度は必須です" }, { status: 400 });
  }

  const diffLabel = DIFFICULTIES[difficulty as keyof typeof DIFFICULTIES] ?? "ふつう";
  const feedbackText = feedback
    ? `\n\n前回の草案へのフィードバック：${feedback}\nこのフィードバックを反映して改善してください。`
    : "";

  const prompt = `あなたはカメラ・写真技術の教育専門家です。
以下の条件で、カメラドリルアプリ用の4択クイズ問題を1問作成してください。

条件：
- カテゴリ：${category}（${CATEGORIES.join("・")}のいずれか）
- 難易度：${diffLabel}
- 対象：カメラ・写真に興味がある初心者〜中級者${feedbackText}

出力形式（JSON）：
{
  "question": "問題文（疑問形で明確に）",
  "choices": [
    { "label": "A", "text": "選択肢A" },
    { "label": "B", "text": "選択肢B" },
    { "label": "C", "text": "選択肢C" },
    { "label": "D", "text": "選択肢D" }
  ],
  "answer": "正解のラベル（A/B/C/Dのいずれか）",
  "explanation": "正解の理由と学習ポイントの解説（2〜3文）"
}

JSONのみを出力してください。説明文や\`\`\`は不要です。`;

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
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  let parsed;
  try {
    const jsonStr = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    parsed = JSON.parse(jsonStr);
  } catch {
    return NextResponse.json({ error: "AIの出力をパースできませんでした", raw }, { status: 500 });
  }

  return NextResponse.json({ ...parsed, category, difficulty });
}
