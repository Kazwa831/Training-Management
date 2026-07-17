# 進捗記録

このファイルは作業が一区切りつくたびに更新する。仕様の正本は `docs/Training-Management-project-design-doc.md`。

---

## 2026-07-13: プロジェクト初期セットアップ

### やったこと

1. 設計書(`docs/Training-Management-project-design-doc.md`)を解析
2. 技術スタックと実装順序を整理(下記参照、詳細は`CLAUDE.md`にも記載)
3. `create-next-app`でNext.js(App Router + TypeScript + Tailwind CSS v4)プロジェクトを作成
4. 必要ライブラリを追加:`@supabase/supabase-js`, `@anthropic-ai/sdk`, `recharts`, `zod`
5. `.gitignore`を確認(`.env*`, `.DS_Store`等が既にカバーされていることを確認、追加変更なし)
6. ディレクトリ構成の雛形を作成(画面ルーティング・ボトムナビの枠組みのみ。中身は未実装)
7. `CLAUDE.md`を作成(プロジェクト概要・設計方針・コーディングルール等)
8. `docs/progress.md`(本ファイル)を作成
9. Gitリポジトリを初期化し、GitHubリモート(`origin`)を接続

### 開発計画

**目的**: 就職活動用ポートフォリオとして、週複数回ジムに通う個人が、体調(疲労度・体重)と体型(身長・体脂肪率・目標)に応じたAIメニュー提案を受けながら、筋トレ記録を管理できるWebアプリを作る。

**スコープ**: 仕様書4章で「MVP」と指定された機能のみ。Phase2項目はコード内にTODOコメントを残す程度に留め、実装しない。

### 技術スタック

| 項目 | 選定 | 理由 |
|---|---|---|
| フロントエンド | Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 | Vercelとの親和性、実装実績の多さ |
| ホスティング | Vercel(無料Hobby) | GitHub連携で自動デプロイ、スマホからのアクセス対応 |
| DB | Supabase(無料、PostgreSQL) | 無料クラウドDB、Next.jsとの連携が容易 |
| AI | Anthropic Claude API(`@anthropic-ai/sdk`) | サーバー側からのみ呼び出し、AIメニュー提案に使用 |
| グラフ | Recharts | Reactとの親和性 |
| バリデーション | Zod | Server Action/API入力値検証。Next.js公式ガイドでも推奨 |
| 認証 | 環境変数パスコード + httpOnly Cookie | 個人利用のため簡易方式で十分 |

**追加ライブラリ導入理由**:
- `@supabase/supabase-js`: SupabaseのDBへサーバー側からアクセスするための公式クライアント
- `@anthropic-ai/sdk`: Anthropic Messages APIをサーバー側から型安全に呼び出すための公式SDK
- `recharts`: 体重・体脂肪率・疲労度・種目別重量の推移グラフ描画に使用(設計書7章で指定)
- `zod`: フォーム入力・API入力のスキーマ検証。Next.js公式のServer Action実装ガイドでも推奨されている検証ライブラリ

### ディレクトリ構成

`CLAUDE.md`の「4. ディレクトリ構成」を正とする。概要:

```
src/
  app/
    login/            # ログイン画面
    (main)/            # ボトムナビ配下:today, history, graph, profile
    api/               # auth, suggest, body-metrics, workout-logs, profile
  components/
    layout/            # BottomNav
    ui/, today/, history/, graph/, profile/  # 画面別・汎用コンポーネント(今後追加)
  lib/
    supabase/, anthropic/, exercises.ts, utils.ts
  types/
    database.ts
  proxy.ts             # 認証ガード(Next.js 16ではmiddleware.tsではなくproxy.ts)
```

### 実装順序

1. 基盤構築(本セットアップ) ← **完了**
2. Supabaseプロジェクト作成・テーブル作成・接続確認
3. 認証(パスコードログイン + proxy.tsによる保護)
4. プロフィール画面(身長・体脂肪率・目標、BMI計算)
5. 今日画面:体重・疲労度の記録
6. 種目カタログ定数の整備 + 手動メニュー選択・セット記録
7. AIメニュー提案(`/api/suggest`)+ ルールベースフォールバック
8. セット間インターバルタイマー
9. 履歴画面
10. グラフ画面
11. 全体動作確認・Vercelデプロイ

### 重要な発見・注意点

- **Next.js 16で`middleware.ts`が`proxy.ts`に名称変更**(関数名も`middleware()`→`proxy()`)。設計書9章の認証ガードは`src/proxy.ts`として実装する必要がある。`node_modules/next/dist/docs/`のバンドルドキュメントで確認済み。
- 設計書13章で言及されている「claude.ai上のプロトタイプ(単一HTMLファイル)」がリポジトリ内に見当たらない。種目カタログの具体名・UIトーンの参考実装として必要なため、ユーザーに確認が必要。

### 動作確認

- `npm run build` 成功(全ルート: `/`, `/login`, `/today`, `/history`, `/graph`, `/profile` が静的生成されることを確認)

### 次にやること

- 認証機能の実装から着手

---

## 2026-07-17: Supabase接続セットアップ

### やったこと

1. `supabase/schema.sql` を作成(設計書6章のテーブル定義をそのまま採用)
2. `.env.local.example` を作成し、`.gitignore` に `!.env*.example` を追加(サンプルファイルは追跡対象、実際の`.env.local`は除外のまま)
3. `src/lib/supabase/server.ts` にサーバー専用のSupabaseクライアントを実装
4. ユーザーがSupabaseプロジェクトを新規作成し、`schema.sql`の内容をSQL Editorで実行、`.env.local`に接続情報を設定
5. 接続確認スクリプトで4テーブル(`profile`, `body_metrics`, `workout_logs`, `workout_sets`)へのSELECTを検証

### トラブルシューティング

- **事象**: `SUPABASE_URL`に誤って`/rest/v1/`を付与してしまい接続失敗 → クライアントライブラリはプロジェクトのベースURLのみを期待し内部で`/rest/v1`を付加するため、パス無しの形に修正
- **事象**: 修正後も`permission denied for table profile`(Postgresエラーコード`42501`)が発生
  - ユーザーからの指摘を受け、原始的な推測ではなく系統的に切り分けを実施:
    1. `.env.local`の読み込み確認(問題なし)
    2. キーのJWTペイロードをデコードし`role: "service_role"`であることを確認(問題なし)
    3. `createSupabaseServerClient`の実装確認(問題なし、公式ドキュメント通り)
    4. リクエストURL・レスポンスヘッダー(`sb-project-ref`等)で正しいプロジェクトのPostgRESTに到達していることを確認
    5. エラーの発生源はPostgres自身が返す権限エラーであり、クライアント側の実装・設定の問題ではないと結論
  - **原因**: SQL EditorでCREATE TABLEしただけでは`service_role`ロールへのテーブル権限(GRANT)が自動付与されないケースがあった
  - **対応**: `supabase/schema.sql`末尾に`grant`/`alter default privileges`文を追加し、SQL Editorで実行してもらい解消

### 動作確認

- 接続確認スクリプト(一時ファイル、確認後削除)で4テーブルすべてに対しSELECTが成功することを確認(いずれも0件、テーブルは空だが正常にアクセス可能な状態)

### 次にやること

- 認証機能(パスコードログイン + `src/proxy.ts`)の実装に着手

---

## 2026-07-17: 認証機能(パスコードログイン)の実装

### やったこと

1. `src/lib/auth.ts`:パスコード照合・トークン発行・検証ロジック
   - Cookieには生のパスコードを保存せず、`APP_PASSCODE`を鍵にしたHMAC-SHA256のトークンを保存する方式にした(Cookie漏洩時にパスコード自体は特定できない)
   - パスコード照合・トークン照合はいずれも`timingSafeEqual`でタイミング攻撃を軽減
2. `src/app/api/auth/login/route.ts`:パスコード照合 → 成功時にhttpOnly Cookie(`auth_token`、30日)を発行
3. `src/app/api/auth/logout/route.ts`:Cookie削除
4. `src/app/login/page.tsx`:パスコード入力フォーム(クライアントコンポーネント)
5. `src/proxy.ts`:全ページ・全APIを保護する認証ガード
   - **Next.js 16では`middleware.ts`ではなく`proxy.ts`、関数名も`proxy()`**という新しい規約に対応(前回のセットアップ時に確認済みの内容を実装に反映)
   - `/login`、`/api/auth/login`、静的アセットは保護対象外にmatcherで除外
   - 未認証時:画面は`/login`へリダイレクト、APIは401 JSON

### 動作確認

`npm run dev`でローカルサーバーを起動し、curlで一通りのフローを確認:

1. 未ログインで`/today`にアクセス → `/login`へ307リダイレクト ✅
2. 未ログインで`/api/body-metrics`にアクセス → 401 `{"error":"認証が必要です"}` ✅
3. 誤ったパスコードでログイン → 401 `{"error":"パスコードが違います"}` ✅
4. 正しいパスコードでログイン → 200 + `Set-Cookie: auth_token=...; HttpOnly; SameSite=lax; Max-Age=2592000` ✅
5. Cookie付きで`/today`にアクセス → 200 ✅
6. ログアウト → Cookieが空値+過去日付で上書きされ削除される ✅
7. ログアウト後に`/today`へアクセス → 再び`/login`へリダイレクト ✅

`.env.local`の`APP_PASSCODE`は動作確認用に仮の値(`temp1234`)を設定済み。本番用の値は後で自由に変更可能。

### 次にやること

- プロフィール画面(身長・体脂肪率・目標の登録、BMI自動算出)の実装

---

## 2026-07-17: プロフィール画面(身長・体脂肪率・目標・BMI)の実装

### やったこと

1. `src/lib/utils.ts`
   - `getTodayDateString()`:日本時間基準で「今日」の日付文字列を返すヘルパー。サーバーがUTCで動く場合、単純な`new Date()`だと深夜0〜9時の間に日付が1日ずれるため、タイムゾーンを明示して算出
   - `calculateBmi(heightCm, weightKg)`:BMI算出(設計書4.2節、あくまで参考値)
2. `src/app/api/profile/route.ts`
   - `GET`:プロフィール(身長・目標)と直近の体重・体脂肪率を取得し、BMIを算出して返す
   - `PUT`:身長・目標を`profile`テーブル(id固定1行)にupsert
3. `src/app/api/body-metrics/route.ts`
   - `POST`:体重・体脂肪率・疲労度を日付ごとにupsert(部分更新に対応)
   - 設計上の注意点:`body_metrics.weight_kg`は`NOT NULL`のため、その日にまだ体重の記録が無い状態で体脂肪率だけを送ると、DBの制約違反を起こす前に分かりやすいエラーメッセージ(「体重を先に記録してください」)を返すようにした
4. `src/app/(main)/profile/page.tsx`:身長入力・目標選択(増量/減量/維持)・体脂肪率入力(今日時点)・直近体重とBMIの表示を実装

### 動作確認

`npm run dev`+curlでAPIを一通り確認、その後テストデータを削除:

1. `GET /api/profile`(初期状態) → 全項目`null`で正常返却 ✅
2. `PUT /api/profile`(身長170cm・目標:減量) → 200で保存 ✅
3. 体重未記録の日に`POST /api/body-metrics`で体脂肪率のみ送信 → 400 + 分かりやすいエラーメッセージ ✅(意図通りの制約チェック)
4. 体重70.5kgを送信 → 新規作成成功 ✅
5. `GET /api/profile` → `bmi: 24.39...`(170cm/70.5kgの計算値と一致)が返る ✅
6. 同じ日に体脂肪率18.5を追加送信 → 部分更新成功、体重は保持されたまま体脂肪率のみ反映 ✅
7. 不正な`goal`値("invalid")を送信 → 400 ✅(Zodバリデーションが機能)
8. `/profile`画面がログイン状態で200で表示され、「プロフィール」の文言が描画されることを確認 ✅

確認後、テストで入れた`profile`/`body_metrics`のデータはクリーンな状態に削除済み。

### 次にやること

- 今日画面:体重・疲労度の記録(`/api/body-metrics`を今日画面からも利用)
