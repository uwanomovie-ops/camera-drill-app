CREATE TABLE "question_sets" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"set_id" integer,
	"category" text NOT NULL,
	"question" text NOT NULL,
	"choices" jsonb NOT NULL,
	"answer" text NOT NULL,
	"explanation" text NOT NULL,
	"difficulty" text DEFAULT 'medium' NOT NULL,
	"type" text DEFAULT 'multiple_choice' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_answers" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"question_id" integer NOT NULL,
	"selected_label" text NOT NULL,
	"is_correct" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"anonymous_user_id" text NOT NULL,
	"score" integer NOT NULL,
	"total" integer NOT NULL,
	"completed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_set_id_question_sets_id_fk" FOREIGN KEY ("set_id") REFERENCES "public"."question_sets"("id") ON DELETE set null ON UPDATE no action;