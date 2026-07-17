"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { Goal } from "@/types/database";

const GOAL_OPTIONS: { value: Goal; label: string }[] = [
  { value: "bulk", label: "増量" },
  { value: "cut", label: "減量" },
  { value: "maintain", label: "維持" },
];

type ProfileResponse = {
  heightCm: number | null;
  goal: Goal | null;
  latestWeightKg: number | null;
  latestBodyFatPct: number | null;
  latestBodyMetricsDate: string | null;
  bmi: number | null;
};

// プロフィール画面:身長・体脂肪率・目標の設定/更新、BMI表示(設計書 5章・4.2節)
export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [heightCm, setHeightCm] = useState("");
  const [goal, setGoal] = useState<Goal | "">("");
  const [bodyFatPct, setBodyFatPct] = useState("");
  const [latestWeightKg, setLatestWeightKg] = useState<number | null>(null);
  const [bmi, setBmi] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/profile");
      const data: ProfileResponse = await response.json();
      setHeightCm(data.heightCm != null ? String(data.heightCm) : "");
      setGoal(data.goal ?? "");
      setBodyFatPct(
        data.latestBodyFatPct != null ? String(data.latestBodyFatPct) : "",
      );
      setLatestWeightKg(data.latestWeightKg);
      setBmi(data.bmi);
      setIsLoading(false);
    }
    load();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    setIsSaving(true);

    // 1. 身長・目標をプロフィールとして保存
    const profileResponse = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        heightCm: heightCm === "" ? null : Number(heightCm),
        goal: goal === "" ? null : goal,
      }),
    });

    if (!profileResponse.ok) {
      const data = await profileResponse.json();
      setError(data.error ?? "保存に失敗しました");
      setIsSaving(false);
      return;
    }

    // 2. 体脂肪率が入力されていれば、今日の日付の記録として保存
    if (bodyFatPct !== "") {
      const bodyMetricsResponse = await fetch("/api/body-metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bodyFatPct: Number(bodyFatPct) }),
      });

      if (!bodyMetricsResponse.ok) {
        const data = await bodyMetricsResponse.json();
        setError(data.error ?? "体脂肪率の保存に失敗しました");
        setIsSaving(false);
        return;
      }
    }

    // 保存後、最新のBMI等を再取得して画面に反映する
    const refreshed: ProfileResponse = await fetch("/api/profile").then((r) =>
      r.json(),
    );
    setLatestWeightKg(refreshed.latestWeightKg);
    setBmi(refreshed.bmi);

    setMessage("保存しました");
    setIsSaving(false);
  }

  if (isLoading) {
    return (
      <main className="p-4">
        <h1 className="text-xl font-bold">プロフィール</h1>
        <p className="mt-4 text-neutral-400">読み込み中...</p>
      </main>
    );
  }

  return (
    <main className="p-4">
      <h1 className="text-xl font-bold">プロフィール</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div>
          <label htmlFor="height" className="block text-sm text-neutral-400">
            身長(cm)
          </label>
          <input
            id="height"
            type="number"
            inputMode="decimal"
            step="0.1"
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
            className="mt-1 min-h-[44px] w-full rounded-md border border-neutral-700 bg-neutral-900 px-4 py-2 text-neutral-100"
            placeholder="例: 170"
          />
        </div>

        <div>
          <span className="block text-sm text-neutral-400">目標</span>
          <div className="mt-1 flex gap-2">
            {GOAL_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setGoal(option.value)}
                className={`min-h-[44px] flex-1 rounded-md border px-3 text-sm ${
                  goal === option.value
                    ? "border-amber-500 bg-amber-500/10 text-amber-400"
                    : "border-neutral-700 text-neutral-300"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label
            htmlFor="bodyFatPct"
            className="block text-sm text-neutral-400"
          >
            体脂肪率(%)・今日時点
          </label>
          <input
            id="bodyFatPct"
            type="number"
            inputMode="decimal"
            step="0.1"
            value={bodyFatPct}
            onChange={(e) => setBodyFatPct(e.target.value)}
            className="mt-1 min-h-[44px] w-full rounded-md border border-neutral-700 bg-neutral-900 px-4 py-2 text-neutral-100"
            placeholder="例: 18.5"
          />
        </div>

        <div className="rounded-md border border-neutral-800 bg-neutral-900/50 p-4 text-sm">
          <p className="text-neutral-400">
            直近の体重: {latestWeightKg != null ? `${latestWeightKg}kg` : "未記録"}
          </p>
          <p className="mt-1 text-neutral-400">
            BMI: {bmi != null ? bmi.toFixed(1) : "算出には身長・体重の記録が必要です"}
            <span className="ml-2 text-xs text-neutral-500">
              ※あくまで参考値です
            </span>
          </p>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {message && <p className="text-sm text-emerald-400">{message}</p>}

        <button
          type="submit"
          disabled={isSaving}
          className="min-h-[44px] w-full rounded-md bg-amber-500 font-medium text-neutral-950 disabled:opacity-50"
        >
          {isSaving ? "保存中..." : "保存"}
        </button>
      </form>
    </main>
  );
}
