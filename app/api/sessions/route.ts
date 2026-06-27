import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/db";
import { quizSessions, quizAnswers } from "@/src/db/schema";
import { eq, desc } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { anonymousUserId, score, total, answers } = body;

  if (!anonymousUserId || score === undefined || !total) {
    return NextResponse.json({ error: "必須フィールドが不足しています" }, { status: 400 });
  }

  const [session] = await db
    .insert(quizSessions)
    .values({ anonymousUserId, score, total })
    .returning();

  if (answers && Array.isArray(answers)) {
    await db.insert(quizAnswers).values(
      answers.map((a: { questionId: number; selectedLabel: string; isCorrect: boolean }) => ({
        sessionId: session.id,
        questionId: a.questionId,
        selectedLabel: a.selectedLabel,
        isCorrect: a.isCorrect,
      }))
    );
  }

  return NextResponse.json(session, { status: 201 });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userIdが必要です" }, { status: 400 });
  }

  const sessions = await db
    .select()
    .from(quizSessions)
    .where(eq(quizSessions.anonymousUserId, userId))
    .orderBy(desc(quizSessions.completedAt))
    .limit(10);

  return NextResponse.json(sessions);
}
