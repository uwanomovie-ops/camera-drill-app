import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/db";
import { questions } from "@/src/db/schema";
import { eq, and, asc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const difficulty = searchParams.get("difficulty");
  // admin=true を渡すと未公開問題も含む（管理画面の統計用）
  const admin = searchParams.get("admin") === "true";

  const conditions = [
    ...(category ? [eq(questions.category, category)] : []),
    ...(difficulty ? [eq(questions.difficulty, difficulty)] : []),
    ...(!admin ? [eq(questions.published, true)] : []),
  ];

  const rows = await db
    .select()
    .from(questions)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(questions.id));

  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { category, question, choices, answer, explanation, difficulty, type, setId } = body;

  if (!category || !question || !choices || !answer || !explanation) {
    return NextResponse.json({ error: "必須フィールドが不足しています" }, { status: 400 });
  }

  // セット内での順序はセット末尾に追加
  let orderIndex = 0;
  if (setId) {
    const existing = await db
      .select()
      .from(questions)
      .where(eq(questions.setId, setId));
    orderIndex = existing.length;
  }

  const [created] = await db
    .insert(questions)
    .values({
      category,
      question,
      choices,
      answer,
      explanation,
      difficulty: difficulty ?? "medium",
      type: type ?? "multiple_choice",
      setId: setId ?? null,
      orderIndex,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
