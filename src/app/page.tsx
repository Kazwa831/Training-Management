import { redirect } from "next/navigation";

// ルートアクセス時は「今日」画面へ誘導する
export default function Home() {
  redirect("/today");
}
