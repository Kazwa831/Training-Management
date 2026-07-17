"use client";

import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EXERCISES } from "@/lib/exercises";
import type { ExerciseCategory } from "@/types/exercise";

const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  legs: "下半身",
  push: "上半身プッシュ",
  pull: "上半身プル",
  core: "体幹",
  cardio: "有酸素",
};

function formatDateTick(date: string): string {
  const [, month, day] = date.split("-");
  return `${Number(month)}/${Number(day)}`;
}

type Point = { date: string; weightKg: number };

// グラフ画面:種目別重量推移(種目選択式、設計書 5章)
export function ExerciseWeightChart() {
  const [exerciseId, setExerciseId] = useState(EXERCISES[0].id);
  const [points, setPoints] = useState<Point[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      const response = await fetch(
        `/api/graph/exercise-weight?exerciseId=${exerciseId}`,
      );
      const data = await response.json();
      setPoints(data.points ?? []);
      setIsLoading(false);
    }
    load();
  }, [exerciseId]);

  return (
    <div className="rounded-md border border-neutral-800 bg-neutral-900/50 p-4">
      <p className="text-sm text-neutral-400">種目別重量推移</p>

      <select
        value={exerciseId}
        onChange={(e) => setExerciseId(e.target.value)}
        className="mt-2 min-h-[44px] w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 text-neutral-100"
      >
        {(Object.keys(CATEGORY_LABELS) as ExerciseCategory[]).map((category) => (
          <optgroup key={category} label={CATEGORY_LABELS[category]}>
            {EXERCISES.filter((exercise) => exercise.category === category).map(
              (exercise) => (
                <option key={exercise.id} value={exercise.id}>
                  {exercise.name}
                </option>
              ),
            )}
          </optgroup>
        ))}
      </select>

      {isLoading ? (
        <p className="mt-4 text-sm text-neutral-400">読み込み中...</p>
      ) : points.length > 0 ? (
        <div className="mt-3 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points}>
              <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDateTick}
                stroke="#a3a3a3"
                fontSize={12}
              />
              <YAxis stroke="#a3a3a3" fontSize={12} unit="kg" domain={["auto", "auto"]} />
              <Tooltip
                labelFormatter={(label) => formatDateTick(String(label))}
                formatter={(value) => [`${value}kg`, "重量"]}
                contentStyle={{
                  backgroundColor: "#171717",
                  border: "1px solid #404040",
                  borderRadius: 6,
                }}
              />
              <Line type="monotone" dataKey="weightKg" stroke="#f97316" dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="mt-4 text-sm text-neutral-500">この種目の記録はまだありません。</p>
      )}
    </div>
  );
}
