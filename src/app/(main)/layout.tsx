import { BottomNav } from "@/components/layout/BottomNav";

// 「今日」「履歴」「グラフ」「プロフィール」4タブ共通のレイアウト(設計書 5章)
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen pb-16">
      {children}
      <BottomNav />
    </div>
  );
}
