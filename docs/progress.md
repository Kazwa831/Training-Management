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

- プロトタイプファイルの有無をユーザーに確認
- Supabaseプロジェクトの作成(ユーザー側で実施が必要な場合あり)
- 認証機能の実装から着手
