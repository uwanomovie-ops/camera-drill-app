import { pgTable, serial, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

export const questionSets = pgTable("question_sets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  setId: integer("set_id").references(() => questionSets.id, { onDelete: "set null" }),
  category: text("category").notNull(),
  question: text("question").notNull(),
  choices: jsonb("choices").notNull().$type<{ label: string; text: string }[]>(),
  answer: text("answer").notNull(),
  explanation: text("explanation").notNull(),
  difficulty: text("difficulty").notNull().default("medium"),
  type: text("type").notNull().default("multiple_choice"),
  orderIndex: integer("order_index").notNull().default(0),
  published: boolean("published").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const quizSessions = pgTable("quiz_sessions", {
  id: serial("id").primaryKey(),
  anonymousUserId: text("anonymous_user_id").notNull(),
  score: integer("score").notNull(),
  total: integer("total").notNull(),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

export const quizAnswers = pgTable("quiz_answers", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  questionId: integer("question_id").notNull(),
  selectedLabel: text("selected_label").notNull(),
  isCorrect: boolean("is_correct").notNull(),
});
