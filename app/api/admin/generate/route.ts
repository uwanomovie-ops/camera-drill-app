import { NextRequest, NextResponse } from "next/server";

const CATEGORIES = ["露出", "レンズ", "構図", "ライティング", "カメラの仕組み"];
const DIFFICULTIES = { easy: "やさしい", medium: "ふつう", hard: "むずかしい" };

function buildPrompt(category: string, diffLabel: string, type: string, feedbackText: string): string {
  const base = `あなたはカメラ・写真技術の教育専門家です。
カテゴリ：${category}　難易度：${diffLabel}　対象：カメラ・写真に興味がある初心者〜中級者${feedbackText}

`;

  if (type === "true_false") {
    return base + `以下の条件で「○×問題」を1問作成してください。
文章が正しければ○、誤りであれば×となる問題を作ってください。

出力形式（JSON）：
{
  "question": "問題文（〜である。という断定形で書く）",
  "choices": [
    { "label": "A", "text": "○" },
    { "label": "B", "text": "×" }
  ],
  "answer": "正解のラベル（AまたはB）",
  "explanation": "正解の理由と学習ポイントの解説（2〜3文）"
}

JSONのみを出力してください。説明文や\`\`\`は不要です。`;
  }

  if (type === "fill_blank") {
    return base + `以下の条件で「穴埋め問題」を1問作成してください。
文中の重要なキーワード2箇所を___（アンダースコア3つ）に置き換えた問題を作ってください。
選択肢は4つ用意し、そのうち2つが正解（空欄に入る語）、2つがダミーです。
answerには空欄1・空欄2に対応する選択肢のラベルをカンマ区切りで記載してください。

出力形式（JSON）：
{
  "question": "問題文（空欄2箇所を___で表す。例：絞りを___にすると背景が___になる。）",
  "choices": [
    { "label": "A", "text": "正解語1（空欄1に入る語）" },
    { "label": "B", "text": "正解語2（空欄2に入る語）" },
    { "label": "C", "text": "ダミー選択肢1" },
    { "label": "D", "text": "ダミー選択肢2" }
  ],
  "answer": "A,B",
  "explanation": "正解の理由と学習ポイントの解説（2〜3文）"
}

JSONのみを出力してください。説明文や\`\`\`は不要です。`;
  }

  if (type === "ordering") {
    return base + `以下の条件で「並べ替え問題」を1問作成してください。
カメラ・写真に関連する手順やプロセスを正しい順番に並べさせる問題を作ってください。
項目は必ず4個作成し、choicesには正しい順番で記載してください（アプリ側でシャッフルします）。
answerには正しい順番のラベルをカンマ区切りで記載してください。

出力形式（JSON）：
{
  "question": "問題文（〜を正しい順番に並べてください。という形式で）",
  "choices": [
    { "label": "A", "text": "1番目に来る項目" },
    { "label": "B", "text": "2番目に来る項目" },
    { "label": "C", "text": "3番目に来る項目" },
    { "label": "D", "text": "4番目に来る項目" }
  ],
  "answer": "A,B,C,D",
  "explanation": "正しい順番の理由と学習ポイントの解説（2〜3文）"
}

JSONのみを出力してください。説明文や\`\`\`は不要です。`;
  }

  if (type === "matching") {
    return base + `以下の条件で「関連付け問題」を1問作成してください。
カメラ・写真に関連する概念・用語と説明を正しく組み合わせさせる問題を作ってください。
3ペアのアイテムを作成し、choicesの前半3つが左側アイテム（A,B,C）、後半3つが右側アイテム（D,E,F）です。
answerは左のラベル:右のラベルをカンマ区切りで記載してください。

出力形式（JSON）：
{
  "question": "問題文（〜を正しく組み合わせてください。という形式で）",
  "choices": [
    { "label": "A", "text": "左側の概念・用語1" },
    { "label": "B", "text": "左側の概念・用語2" },
    { "label": "C", "text": "左側の概念・用語3" },
    { "label": "D", "text": "右側の説明・対応する語1（Aに対応）" },
    { "label": "E", "text": "右側の説明・対応する語2（Bに対応）" },
    { "label": "F", "text": "右側の説明・対応する語3（Cに対応）" }
  ],
  "answer": "A:D,B:E,C:F",
  "explanation": "各組み合わせの理由と学習ポイントの解説（2〜3文）"
}

JSONのみを出力してください。説明文や\`\`\`は不要です。`;
  }

  // default: multiple_choice
  return base + `以下の条件で「4択クイズ問題」を1問作成してください。

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
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY が設定されていません" }, { status: 500 });
  }

  const body = await request.json();
  const { category, difficulty, type = "multiple_choice", feedback } = body;

  if (!category || !difficulty) {
    return NextResponse.json({ error: "カテゴリと難易度は必須です" }, { status: 400 });
  }

  const diffLabel = DIFFICULTIES[difficulty as keyof typeof DIFFICULTIES] ?? "ふつう";
  const feedbackText = feedback
    ? `\n\n前回の草案へのフィードバック：${feedback}\nこのフィードバックを反映して改善してください。`
    : "";

  const prompt = buildPrompt(category, diffLabel, type, feedbackText);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
          responseMimeType: "application/json",
        },
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
    // responseMimeType: application/json 指定時はそのままパース可能なことが多い
    // 万が一コードブロックが混入した場合も除去して対応
    let jsonStr = raw
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();
    const match = jsonStr.match(/\{[\s\S]*\}/);
    if (match) jsonStr = match[0];
    parsed = JSON.parse(jsonStr);
  } catch {
    console.error("Parse failed. Raw output:", raw);
    return NextResponse.json(
      { error: "AIの出力をパースできませんでした。もう一度お試しください。", raw },
      { status: 500 }
    );
  }

  return NextResponse.json({ ...parsed, category, difficulty, type });
}
