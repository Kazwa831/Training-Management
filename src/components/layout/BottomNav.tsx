"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// ボトムナビの4タブ。設計書 5章の画面設計に対応。
const NAV_ITEMS = [
  { href: "/today", label: "今日" },
  { href: "/history", label: "履歴" },
  { href: "/graph", label: "グラフ" },
  { href: "/profile", label: "プロフィール" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-neutral-800 bg-neutral-950">
      <ul className="flex">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                // ジムでの片手操作を想定し、タップ領域を44px以上確保(設計書11章)
                className={`flex min-h-[44px] items-center justify-center py-3 text-sm ${
                  isActive ? "text-amber-400" : "text-neutral-400"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
