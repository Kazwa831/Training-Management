import { HistoryList } from "@/components/history/HistoryList";

// 履歴画面:日付降順のログ一覧、タップで詳細展開(設計書 5章)
export default function HistoryPage() {
  return (
    <main className="p-4">
      <h1 className="text-xl font-bold">履歴</h1>
      <div className="mt-6">
        <HistoryList />
      </div>
    </main>
  );
}
