import { BodyMetricsCharts } from "@/components/graph/BodyMetricsCharts";
import { ExerciseWeightChart } from "@/components/graph/ExerciseWeightChart";

// グラフ画面:体重・体脂肪率・疲労度の推移、種目別重量推移(設計書 5章)
export default function GraphPage() {
  return (
    <main className="p-4">
      <h1 className="text-xl font-bold">グラフ</h1>

      <section className="mt-6">
        <BodyMetricsCharts />
      </section>

      <section className="mt-6">
        <ExerciseWeightChart />
      </section>
    </main>
  );
}
