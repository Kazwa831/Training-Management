-- 筋トレ管理アプリ テーブル定義
-- 設計書 docs/Training-Management-project-design-doc.md 6章のSQLをそのまま採用。
-- Supabaseダッシュボードの SQL Editor でこのファイルの内容を実行してテーブルを作成する。

-- プロフィール(1行のみ運用)
create table profile (
  id           smallint primary key default 1,
  height_cm    numeric,
  goal         text check (goal in ('bulk','cut','maintain')),
  updated_at   timestamptz default now()
);

-- 体重・体脂肪率・疲労度(日付ごと。ワークアウトをしない日も記録可)
create table body_metrics (
  id             uuid primary key default gen_random_uuid(),
  date           date unique not null,
  weight_kg      numeric not null,
  body_fat_pct   numeric,
  fatigue_level  smallint check (fatigue_level between 1 and 5),
  created_at     timestamptz default now()
);

-- ワークアウト記録(1日1件)
create table workout_logs (
  id                    uuid primary key default gen_random_uuid(),
  date                  date unique not null,
  day_type              text check (day_type in ('legs','push','pull','cardio_core')),
  ai_comment            text,
  cardio_exercise_id    text,
  cardio_target_minutes numeric,
  cardio_actual_minutes numeric,
  note                  text,
  feedback              text check (feedback in ('good','bad')), -- Phase2で使用
  created_at            timestamptz default now()
);

-- ワークアウト内の種目ごとのセット記録
create table workout_sets (
  id                 uuid primary key default gen_random_uuid(),
  workout_log_id     uuid references workout_logs(id) on delete cascade,
  exercise_id        text not null,       -- カタログのid(src/lib/exercises.ts参照)
  set_index          smallint not null,
  target_reps        smallint,
  target_weight_hint numeric,
  actual_reps        smallint,
  actual_weight      numeric,
  note               text
);

-- アプリはサーバー側からservice role keyのみでアクセスするため、
-- service_roleロールに対して明示的にテーブル権限を付与する。
-- (SQL Editorでテーブル作成しただけでは自動付与されない場合があるため)
grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
