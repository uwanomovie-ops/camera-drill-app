import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/db";
import { questions } from "@/src/db/schema";
import { eq, and, asc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const difficulty = searchParams.get("difficulty");

  const conditions = [
    ...(category ? [eq(questions.category, category)] : []),
    ...(difficulty ? [eq(questions.difficulty, difficulty)] : []),
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
  const { category, question, choices, answer, explanation, difficulty, type } = body;

  if (!category || !question || !choices || !answer || !explanation) {
    return NextResponse.json({ error: "必須フィールドが不足しています" }, { status: 400 });
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
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
