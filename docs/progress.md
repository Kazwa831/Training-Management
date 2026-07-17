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

---

## 2026-07-17: 今日画面(体重・疲労度の記録)の実装

### やったこと

1. `src/app/api/body-metrics/route.ts` に `GET` を追加
   - クエリパラメータ`date`(省略時は今日)を受け取り、その日の体重・体脂肪率・疲労度を返す
   - 記録が無い日は各項目`null`で返す(未記録であることを画面側で判別できるように)
2. `src/app/(main)/today/page.tsx`:体重入力・疲労度選択(1〜5段階のボタン)・保存を実装
   - 既存のプロフィール画面と同じ`POST /api/body-metrics`を再利用し、部分更新の仕組みをそのまま活用
   - AI提案・手動メニュー選択・セット記録・インターバルタイマーは未実装であることをTODOコメントで明記(設計順で次以降のステップ)

### 動作確認

`npm run dev`+curlで一連のフローを確認、確認後にテストデータを削除:

1. `GET /api/body-metrics`(今日、未記録) → 全項目`null` ✅
2. `/today`画面がログイン状態で200表示 ✅
3. `POST /api/body-metrics`(体重68.2kg・疲労度3) → 成功 ✅
4. `GET /api/body-metrics` → 保存した値が反映されている ✅
5. 疲労度だけを再送信(部分更新) → 体重68.2kgは保持されたまま疲労度のみ5に更新 ✅
6. 体重に不正な型("abc")を送信 → 400(Zodバリデーション) ✅

### 次にやること

- 種目カタログ定数(`src/lib/exercises.ts`)の新規設計 + 手動メニュー選択・セット記録・保存

---

## 2026-07-17: 種目カタログを初心者向けに拡張(部位・説明・フォーム動画)

ユーザーから、種目カタログを「種目名だけ」から「鍛えられる部位・簡単な説明・フォーム確認動画」を持つ、初心者にも分かりやすい設計に拡張してほしいという依頼を受けて対応。

### 動画表示方法の検討・提案

埋め込みiframe表示 vs 新タブでのリンク表示を、著作権・保守性・実装コストの観点で比較し、**新タブで開くリンク方式**を採用(ユーザーにも提案し合意を得た)。

- 著作権:どちらもYouTube公式の許容範囲内。ただし埋め込みは`iframe`のレスポンシブ対応・CSPの`frame-src`設定・遅延ロード制御が必要で複雑化する
- 保守性:リンク方式は`videoId`の文字列を1つ持つだけで済む
- UX:設計書11章の「ジムのWi-Fi不安定」という前提を踏まえ、YouTubeアプリ/新タブの方が読み込み・操作感が安定する
- 拡張性は`ExerciseMedia`をユニオン型にすることで別途確保(下記)

### データ構造の設計

1. `src/types/exercise.ts`(新規)
   - `ExerciseCategory`:`legs` / `push` / `pull` / `core` / `cardio`(体幹と有酸素を別カテゴリとして管理)
   - `MuscleGroup`:鍛えられる部位(複数指定可能な配列)
   - `ExerciseMedia`:`{ type: "youtube"; videoId }` を含むユニオン型。将来`gif`や`model3d`を追加する場合は型を1つ足すだけでよい設計にした
   - `Exercise`:`id` / `name` / `category` / `muscleGroups` / `description` / `media?`
2. `src/lib/exercises.ts`(全面刷新)
   - 24種目(下半身6・上半身プッシュ6・上半身プル5・体幹3・有酸素4)それぞれに部位・簡単な説明・YouTube動画IDを設定
   - **YouTube動画IDはWeb検索で実在する動画を確認した上で設定**(架空のIDを記載しない)。多くはTarzan Web「Training Movie 100」シリーズ(日本の大手フィットネス誌の公式フォーム解説シリーズ)で統一
   - `getExercisesByCategory` / `getExerciseById` / `getExerciseMediaUrl`(mediaの種類が増えてもここだけ直せばよい)ヘルパーを追加
3. `src/components/today/ExerciseCatalog.tsx`(新規):種目をカテゴリ別に開閉表示し、部位・説明・「フォームを見る」リンク(新タブ)を表示するコンポーネント
4. `src/app/(main)/today/page.tsx`:上記コンポーネントを「種目カタログ」セクションとして追加。体重・疲労度フォームの読み込み状態に関わらず常に表示されるよう構造を調整(静的データのため)

セットの記録・保存(手動メニュー選択からのセット数/回数/重量の入力)は未実装で、次のステップに持ち越し。

### 動作確認

1. データ整合性チェック(一時スクリプト、Node 24のネイティブTypeScript実行機能で確認後に削除):
   - 種目数24件、カテゴリ内訳(下半身6/プッシュ6/プル5/体幹3/有酸素4、プッシュ+プル=11)が設計書通り ✅
   - idの重複なし、全種目にYouTube動画(11文字の正しい形式)・説明文・部位が設定されている ✅
2. `npm run build`成功 ✅
3. `npm run dev`+curlでログイン後に`/today`のHTMLを取得し確認:
   - 「種目カタログ」の見出しと5カテゴリの内訳(下半身(6種目)など)が正しく表示 ✅
   - スクワット・ベンチプレス・プランク・トレッドミルなど種目名が表示 ✅
   - 「フォームを見る」リンクが24件、すべて`target="_blank"`で`youtube.com/watch?v=...`を指している ✅

### 変更したファイル一覧

- `src/types/exercise.ts`(新規):種目カタログ用の型定義
- `src/lib/exercises.ts`(新規):種目カタログ本体(24種目)とヘルパー関数
- `src/components/today/ExerciseCatalog.tsx`(新規):種目カタログ表示コンポーネント
- `src/app/(main)/today/page.tsx`:種目カタログセクションを追加、構造を調整
- `docs/progress.md`:本エントリを追記

### 次にやること

- 手動メニュー選択(種目タイプ選択)・セット数/回数/重量の記録・保存(`workout_logs`/`workout_sets`への保存)

---

## 2026-07-17: 手動メニュー選択・セット記録・保存の実装

### やったこと

1. `src/app/api/workout-logs/route.ts`(新規)
   - `GET`:指定日(省略時は今日)の`workout_logs`と`workout_sets`をまとめて取得。DBには種目×セットのフラットな行で保存されているものを、種目ごとにグルーピングして返す
   - `POST`:`workout_logs`を日付キーでupsertし、`workout_sets`は既存分を全削除してから今回の内容で入れ直す方式にした(個人利用アプリで件数も少ないため、複雑な差分更新ロジックは持たせずシンプルさを優先)
2. `src/components/today/WorkoutRecorder.tsx`(新規)
   - 種目タイプ(下半身/上半身プッシュ/上半身プル/有酸素+体幹)を選択 → 該当カテゴリの種目を追加 → セット(回数・重量)を入力 → 保存、という手動記録フローを実装
   - 「有酸素+体幹」を選んだ場合は、有酸素(種目選択+目標/実施時間)と体幹(セット記録)を両方扱えるようにした(DBの`day_type`は`cardio_core`の1本だが、種目カタログ上は`core`と`cardio`の別カテゴリのため)
   - 既存の記録がある日はページを開いた時点で自動的に読み込み、編集・再保存できるようにした
3. `src/app/(main)/today/page.tsx`に「メニューを記録」セクションを追加

### 動作確認

`npm run dev`+curlで一連のフローを確認、確認後にテストデータを削除:

1. `GET /api/workout-logs`(今日、未記録) → 全項目`null`/空配列 ✅
2. `POST /api/workout-logs`(下半身の日、スクワット2セット+レッグプレス1セット、メモつき) → 成功 ✅
3. `GET /api/workout-logs` → 保存した種目・セット・メモが正しく反映されている ✅
4. 同じ日に`POST`で「有酸素+体幹」の内容(トレッドミル20分+プランク2セット)を送信 → 成功 ✅
5. `GET /api/workout-logs` → 前回の下半身の記録が消え、有酸素+体幹の内容に正しく置き換わっている(upsert+全入れ替えの動作を確認) ✅
6. 不正な`dayType`("invalid")を送信 → 400 ✅

UI側は当初、`WorkoutRecorder`が`useEffect`でのデータ取得中(`isLoading`)は種目タイプボタンを含め何も描画しない実装になっており、サーバー側でレンダリングしたHTMLに種目タイプボタンが含まれない状態だった。今日画面の体重フォームで先に対応した「読み込み状態でも操作可能な要素は隠さない」という方針と合わせ、種目タイプボタンは読み込み中でも表示されるよう修正し、curlでHTMLに4つのボタン(下半身/上半身プッシュ/上半身プル/有酸素+体幹)が含まれることを確認した ✅

### 変更したファイル一覧

- `src/app/api/workout-logs/route.ts`(新規)
- `src/components/today/WorkoutRecorder.tsx`(新規)
- `src/app/(main)/today/page.tsx`:「メニューを記録」セクションを追加

### 次にやること

- AIメニュー提案(`/api/suggest`)+ ルールベースフォールバック

---

## 2026-07-17: AIメニュー提案(/api/suggest)+ ルールベースフォールバックの実装

### やったこと

1. `src/lib/anthropic/client.ts`(新規):サーバー専用のAnthropicクライアント。`ANTHROPIC_API_KEY`未設定時は`null`を返し、呼び出し側でフォールバックへ切り替えられるようにした
2. `src/lib/anthropic/suggest.ts`(新規):提案生成のコアロジック
   - **種目タイプのローテーション**:直近の`workout_logs.day_type`から次のタイプを`legs→push→pull→cardio_core→...`の順で決定(履歴が無ければ`legs`)
   - **AI呼び出し**:システムプロンプトに設計書8.2節の目標別調整方針(増量/減量/維持)をそのまま明記。ユーザープロンプトには体重・疲労度・身長・体脂肪率・目標・今日選べる種目一覧(カタログのid付き)を渡し、JSON形式のみで出力するよう指示
   - **ハルシネーション対策**:AIが返した`exerciseId`が実際のカタログに存在するかを検証し、存在しないIDが含まれる場合はフォールバックに切り替える
   - **フォールバック**:AI呼び出し失敗・JSONパース失敗・不正なIDを含む場合に発動。過去の実績(`workout_sets`)から種目ごとの直近使用重量を取得し、疲労度が高い日(4以上)は回数を10→8、重量目安を10%減らす簡易調整のみ行う(設計書8.3節:「ルールベース版は簡易調整に留めてよい」)
3. `src/app/api/suggest/route.ts`(新規):今日の体重が未記録の場合は提案せず、分かりやすいエラーを返す。それ以外は上記ロジックを呼び出して結果を返す
4. `src/app/api/workout-logs/route.ts`を拡張:`target_reps` / `target_weight_hint`(AI提案の目安値)と`ai_comment`(提案理由コメント)の保存・取得に対応
5. `src/components/today/WorkoutRecorder.tsx`を拡張:「AI提案を受け取る」ボタンを追加。提案結果で種目タイプ・種目・目標reps/重量・コメントを自動セットし、実績値の入力欄には目安をプレースホルダーとして表示。提案元(AI/フォールバック)も画面に表示する

### 動作確認

`npm run dev`+curlで一連のフローを確認、確認後にテストデータを削除:

1. 体重未記録の状態で`POST /api/suggest` → 400「先に体重を記録してください」✅
2. 体重・疲労度(4:高疲労)を記録後、`ANTHROPIC_API_KEY`未設定の状態で`POST /api/suggest` → `source:"fallback"`、`dayType:"legs"`(履歴なしのデフォルト)、疲労度が高いため`targetReps:8`のメニューが返る ✅
3. 下半身の記録を保存後、再度提案 → ローテーションにより`dayType:"push"`に切り替わることを確認 ✅
4. `targetReps`/`targetWeightHint`/`aiComment`を含めて`POST /api/workout-logs`→`GET`で保存・取得できることを確認 ✅
5. `ANTHROPIC_API_KEY`を実際の値に設定してもらい、`POST /api/suggest`を再実行 → `source:"ai"`で、目標(減量)・低疲労度を反映した妥当な提案(回数多め・実在するexerciseId)が生成されることを確認(応答時間 約4.3秒) ✅

### 変更したファイル一覧

- `src/lib/anthropic/client.ts`(新規)
- `src/lib/anthropic/suggest.ts`(新規)
- `src/app/api/suggest/route.ts`(新規)
- `src/app/api/workout-logs/route.ts`:target_reps/target_weight_hint/ai_commentの入出力に対応
- `src/components/today/WorkoutRecorder.tsx`:AI提案ボタン・提案結果の反映・目安のプレースホルダー表示を追加

### 次にやること

- セット間インターバルタイマー

---

## 2026-07-17: セット間インターバルタイマーの実装

### やったこと

1. `src/components/today/IntervalTimer.tsx`(新規)
   - 画面右下に常駐するフローティングウィジェットとして実装(種目カードごとではなく画面全体で1つの共有タイマー)。休憩は同時に1つしか発生しないため、この方が実際の使い方に合っておりシンプル
   - 60/90/120/180秒のプリセット、開始/一時停止/リセット操作
   - 終了時に`navigator.vibrate()`でバイブ通知(対応端末のみ)、Web Audio APIで生成したビープ音を再生(外部音声ファイルを使わない)
   - パネルを閉じてもタイマーはバックグラウンドで継続し、閉じた状態のボタンにも残り時間を表示
2. `src/app/(main)/today/page.tsx`に組み込み

### 動作確認(実ブラウザでの確認)

タイマーはブラウザのタイマー処理・バイブ・音を伴う機能でcurlでは検証できないため、Playwright(Chromiumヘッドレス)を一時的にインストールし、実際にクリック操作を行って確認した(確認後にPlaywrightは`npm uninstall`で削除、`package.json`に変更が残っていないことを確認済み)。

1. 画面右下に⏱アイコンのフローティングボタンが表示される ✅
2. タップするとパネルが開き、60/90/120/180秒のプリセットボタンと開始/リセットボタンが表示される ✅
3. 「開始」を押すとカウントダウンが始まる(60秒選択後、約2秒後に00:58になることを確認) ✅
4. パネルを閉じてもバックグラウンドでカウントダウンが継続し、閉じたボタンに残り時間(00:57)が表示される ✅
5. コンソールエラーなし ✅

**副産物として発見した不具合の修正**:実ブラウザで確認したところ、`globals.css`(create-next-app生成時のデフォルト)に残っていた`body { background: var(--background) }`という素の(レイヤー外の)CSSルールが、`layout.tsx`で指定していたダーク基調のTailwindクラス(`bg-neutral-950`)を上書きしてしまい、画面がほぼ白背景で表示される不具合があった。これはcurlでのHTML確認だけでは気づけず、実際にブラウザでレンダリングして初めて発覚した。Tailwind v4のユーティリティは`@layer`内で生成されるため、レイヤー外の素のセレクタに負けてしまうことが原因。`globals.css`の該当ルールを削除し、`layout.tsx`のTailwindクラスのみで背景・文字色を指定する形に修正し、再度スクリーンショットでダーク基調が正しく適用されていることを確認した。

### 変更したファイル一覧

- `src/components/today/IntervalTimer.tsx`(新規)
- `src/app/(main)/today/page.tsx`:タイマーを組み込み
- `src/app/globals.css`:ダーク基調を上書きしていた不要なbody背景色ルールを削除

### 次にやること

- 履歴画面(一覧・詳細表示)

---

## 2026-07-17: 履歴画面(一覧・詳細表示)の実装

### やったこと

1. `DAY_TYPE_LABELS`(day_typeの日本語表示ラベル)を`src/lib/anthropic/suggest.ts`から`src/lib/exercises.ts`に切り出して共通化(今日画面・履歴画面の2箇所以上で使うため)
2. `src/app/api/history/route.ts`(新規):`GET`で直近60日分(個人利用アプリのためまずはこの件数)の`body_metrics`(体重・疲労度)と`workout_logs`(種目タイプ)を日付ごとにまとめた一覧サマリーを返す。セットの詳細は一覧には含めず、展開時に既存の`/api/body-metrics?date=`・`/api/workout-logs?date=`(どちらも既に日付指定に対応済み)を呼び出す設計にして、一覧取得時の負荷を抑えた
3. `src/components/history/HistoryList.tsx`(新規):日付降順の一覧を`<details>`で開閉表示。タップ時に初めて詳細(体脂肪率・疲労度・種目ごとのセット実績・有酸素・メモ・AIコメント)を取得して表示する
4. `src/app/(main)/history/page.tsx`:上記コンポーネントを組み込み

### 動作確認

3日分のテストデータ(下半身の日・記録なしの日・有酸素+体幹の日)を投入し、`npm run dev`+curl+Playwright(実ブラウザ)で確認、確認後にテストデータ・Playwrightを削除:

1. `GET /api/history` → 日付降順で3日分、`body_metrics`と`workout_logs`の情報が日付ごとに正しく統合されている ✅
2. 履歴一覧画面 → 日付・体重・種目タイプバッジが正しく表示される ✅
3. 「有酸素+体幹」の日を展開 → 疲労度・有酸素種目(トレッドミル18分/目標20分)・体幹種目(プランク)・AIコメントが表示される ✅
4. 「下半身」の日を展開 → スクワット2セット(60kg×10回 / 62kg×8回)とメモが正しく表示される ✅
5. コンソールエラーなし ✅

動作確認中に、体幹種目のように重量が記録されていないセットの表示が「-×30回」と分かりにくかったため、`weight`が無い場合は回数のみ(「30回」)表示するよう修正し、再度スクリーンショットで確認した。

### 変更したファイル一覧

- `src/lib/exercises.ts`:`DAY_TYPE_LABELS`を追加(共通化)
- `src/lib/anthropic/suggest.ts`:重複していたラベル定義を削除し、共通化したものを使うよう変更
- `src/app/api/history/route.ts`(新規)
- `src/components/history/HistoryList.tsx`(新規)
- `src/app/(main)/history/page.tsx`:一覧を組み込み

### 次にやること

- グラフ画面(体重・体脂肪率・疲労度の推移、種目別重量推移)

---

## 2026-07-17: グラフ画面(体重・体脂肪率・疲労度・種目別重量推移)の実装

### やったこと

1. `src/app/api/graph/body-metrics/route.ts`(新規):直近90日分の体重・体脂肪率・疲労度を日付昇順(グラフ表示用)で返す
2. `src/app/api/graph/exercise-weight/route.ts`(新規):指定した`exerciseId`について、日付ごとの最大重量(1日に複数セットある場合はその日の最大値を代表値とする)を日付昇順で返す
3. `src/components/graph/BodyMetricsCharts.tsx`(新規):Rechartsの`LineChart`で体重・体脂肪率・疲労度をそれぞれ別カードで表示。単位(kg/%/1-5段階)が異なるため、無理に1つのグラフにまとめず3枚に分けてシンプルさを優先した
4. `src/components/graph/ExerciseWeightChart.tsx`(新規):種目選択式(`<select>`、カテゴリごとにoptgroup)で種目別の重量推移を表示
5. `src/app/(main)/graph/page.tsx`に組み込み

### 動作確認(実ブラウザでの確認)

グラフ描画はcurlでは確認できないため、Playwrightを一時的にインストールして実ブラウザで確認(確認後にアンインストール、`package.json`への影響なし)。5日分の体重・体脂肪率・疲労度と、スクワットの重量記録(7/13:55kg → 7/17:62.5kg)を投入して確認:

1. `GET /api/graph/body-metrics` / `GET /api/graph/exercise-weight?exerciseId=squat` → 日付昇順で正しく返る ✅
2. グラフ画面で体重・体脂肪率・疲労度の3枚の折れ線グラフが表示される ✅
3. スクリーンショット上で最後の区間(7/16→7/17)が繋がっていないように見えたため、SVGの`<path>`の`d`属性を直接取得して確認したところ、5点すべてを通る1本の連続した曲線になっており、実際には正しく描画されていることを確認(スクリーンショットの見た目だけでは誤解しやすい箇所だった)
4. 種目別重量推移で「スクワット」の2点(55kg→62.5kg)が正しく表示される ✅
5. 記録の無い種目(ベンチプレス)に切り替えると「この種目の記録はまだありません。」の分岐表示になる ✅
6. コンソールエラーなし ✅

### 変更したファイル一覧

- `src/app/api/graph/body-metrics/route.ts`(新規)
- `src/app/api/graph/exercise-weight/route.ts`(新規)
- `src/components/graph/BodyMetricsCharts.tsx`(新規)
- `src/components/graph/ExerciseWeightChart.tsx`(新規)
- `src/app/(main)/graph/page.tsx`:組み込み

### 次にやること

- 全体動作確認・レスポンシブ調整・Vercelデプロイ(MVP最終ステップ)
