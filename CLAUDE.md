@AGENTS.md

# このプロジェクトについて

カメラ用語・撮影技術を学ぶためのクイズアプリ。
本気AIドリル（スクールの教材）をトレースして自作する個人プロジェクト。

- **課題提出期限**: 2026年7月4日
- **公開手段**: Vercel
- **対象ユーザー**: カメラ・写真に興味がある人（初心者〜中級者）

---

# 現在の状態

- Next.js + TypeScript + Tailwind CSS で実装済み・Vercel 公開済み
- 問題データは Neon PostgreSQL（`questions`テーブル）で管理（5カテゴリ）
- UIは本気AIドリルをトレース済み（即回答・ラジオボタン・フィードバックパネル・完了画面）
- 匿名UUID進捗保存（localStorage → quiz_sessions / quiz_answers テーブル）
- Quiz Studio（`/admin`）: パスワード認証 + 問題CRUD + Gemini 2.5 Flash によるAI問題生成
- 5種類の出題タイプ対応: 4択・○×・穴埋め・並べ替え・関連付け
- 難易度フィルター・カテゴリフィルター付きスタート画面
- GitHub: https://github.com/uwanomovie-ops/camera-drill-app
- Vercel: デプロイ済み（Phase 5完了 2026-06-27）

## 技術スタック

- フレームワーク: Next.js 16（App Router・SSR）
- DB: Neon PostgreSQL + Drizzle ORM
- AI: Gemini 2.5 Flash（`/api/admin/generate`）
- スタイル: Tailwind CSS v4

## 環境変数（Vercel・.env.local）

- `DATABASE_URL`: Neon接続文字列
- `ADMIN_PASSWORD`: Quiz Studioパスワード（`camera2026`）
- `GEMINI_API_KEY`: Google AI Studio APIキー

---

# ロードマップ

| Phase | 内容 | 期限 | 状態 |
|-------|------|------|------|
| Phase 1 | 問題データをJSONに分離・問題数を増やす | - | ✅ 完了 |
| Phase 2 | UIを本気AIドリルのスクショからトレース | - | ✅ 完了 |
| Phase 3 | GitHubリポジトリ作成・Vercelで公開 | - | ✅ 完了 |
| Phase 4 | データベース（Neon）導入・進捗管理・Quiz Studio | 7/4 | ✅ 完了 |
| Phase 5 | 難易度調整・複数出題パターン | 7/4 | ✅ 完了 |

**7/4提出の目標はPhase 5まで完成。**

---

# データ管理方針

- **Phase 1〜3**: 問題データは `src/data/questions.json` で管理
- 問題の原稿はMarkdownで書いてAIにJSONへ変換させる
- **Phase 4**: Neon（サーバーレスPostgreSQL）に移行して進捗管理を追加
- **Phase 5**: 問題に `difficulty` フィールド追加・複数の出題パターンに対応

## Phase 4 設計

### DBスキーマ（Neon PostgreSQL）
- `questions`: id, category, question, choices(JSON), answer, explanation, difficulty, created_at
- `quiz_sessions`: id, anonymous_user_id, score, total, completed_at
- `quiz_answers`: id, session_id, question_id, selected_label, is_correct

### ユーザー識別
- ログインなし・匿名
- ブラウザにUUID（`anon_id`）を生成してlocalStorageに保存
- Vercelのサーバーサイドにはcookieで渡す

### Quiz Studio（/admin）
- 認証: 環境変数 `ADMIN_PASSWORD` によるシンプルなパスワード保護
- 機能: 問題の一覧・追加・編集・削除（CRUD）

## Phase 5 設計

### 難易度
- `difficulty: "easy" | "medium" | "hard"` フィールド
- 出題前に難易度フィルターを選べるスタート画面を追加

### 出題パターン
- 選択肢（現在の4択）
- ○×（`true_false` タイプ）
- 穴埋め（`fill_blank` タイプ）
- 問題に `type` フィールドを追加してUIを出し分け

---

# 問題カテゴリ（予定）

- 露出（F値・シャッタースピード・ISO）
- レンズ（焦点距離・ボケ・画角）
- 構図
- ライティング
- カメラの仕組み

---

# UIの方針

- 本気AIドリルのUIをスクリーンショットからトレース
- shadcn/ui を積極的に使う
- スマホ対応（モバイルファースト）必須
