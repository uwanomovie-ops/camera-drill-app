import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/db";
import { questions } from "@/src/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const difficulty = searchParams.get("difficulty");

  let query = db.select().from(questions).orderBy(asc(questions.id));

  const rows = await (category
    ? db.select().from(questions).where(eq(questions.category, category)).orderBy(asc(questions.id))
    : difficulty
    ? db.select().from(questions).where(eq(questions.difficulty, difficulty)).orderBy(asc(questions.id))
    : db.select().from(questions).orderBy(asc(questions.id)));

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
