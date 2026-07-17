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

type Point = {
  date: string;
  weightKg: number | null;
  bodyFatPct: number | null;
  fatigueLevel: number | null;
};

// "2026-07-17" → "7/17" のように短く表示する
function formatDateTick(date: string): string {
  const [, month, day] = date.split("-");
  return `${Number(month)}/${Number(day)}`;
}

function LineCard({
  title,
  data,
  dataKey,
  unit,
  color,
  domain,
}: {
  title: string;
  data: Point[];
  dataKey: "weightKg" | "bodyFatPct" | "fatigueLevel";
  unit: string;
  color: string;
  domain?: [number, number];
}) {
  const hasData = data.some((point) => point[dataKey] != null);

  return (
    <div className="rounded-md border border-neutral-800 bg-neutral-900/50 p-4">
      <p className="text-sm text-neutral-400">{title}</p>
      {hasData ? (
        <div className="mt-2 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDateTick}
                stroke="#a3a3a3"
                fontSize={12}
              />
              <YAxis
                stroke="#a3a3a3"
                fontSize={12}
                domain={domain ?? ["auto", "auto"]}
                unit={unit}
              />
              <Tooltip
                labelFormatter={(label) => formatDateTick(String(label))}
                formatter={(value) => [`${value}${unit}`, title]}
                contentStyle={{
                  backgroundColor: "#171717",
                  border: "1px solid #404040",
                  borderRadius: 6,
                }}
              />
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                connectNulls
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="mt-4 text-sm text-neutral-500">まだ記録がありません。</p>
      )}
    </div>
  );
}

// グラフ画面:体重・体脂肪率・疲労度の推移(設計書 5章)
export function BodyMetricsCharts() {
  const [points, setPoints] = useState<Point[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/graph/body-metrics");
      const data = await response.json();
      setPoints(data.points ?? []);
      setIsLoading(false);
    }
    load();
  }, []);

  if (isLoading) {
    return <p className="text-sm text-neutral-400">読み込み中...</p>;
  }

  return (
    <div className="space-y-4">
      <LineCard title="体重" data={points} dataKey="weightKg" unit="kg" color="#f59e0b" />
      <LineCard
        title="体脂肪率"
        data={points}
        dataKey="bodyFatPct"
        unit="%"
        color="#38bdf8"
      />
      <LineCard
        title="疲労度"
        data={points}
        dataKey="fatigueLevel"
        unit=""
        color="#a3e635"
        domain={[1, 5]}
      />
    </div>
  );
}
