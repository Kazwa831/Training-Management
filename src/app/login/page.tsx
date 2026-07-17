"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

// ログイン画面:パスコード入力のみ(設計書 5章・9章)
export default function LoginPage() {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode }),
    });

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "ログインに失敗しました");
      setIsSubmitting(false);
      return;
    }

    // ログイン成功。今日画面へ遷移し、proxy側の認証状態も最新化する
    router.push("/today");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-4">
        <h1 className="text-center text-xl font-bold">ログイン</h1>

        <input
          type="password"
          autoFocus
          value={passcode}
          onChange={(event) => setPasscode(event.target.value)}
          placeholder="パスコード"
          className="min-h-[44px] w-full rounded-md border border-neutral-700 bg-neutral-900 px-4 py-2 text-center text-lg tracking-widest text-neutral-100 placeholder:text-neutral-500"
        />

        {error && <p className="text-center text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting || passcode.length === 0}
          className="min-h-[44px] w-full rounded-md bg-amber-500 font-medium text-neutral-950 disabled:opacity-50"
        >
          {isSubmitting ? "確認中..." : "ログイン"}
        </button>
      </form>
    </main>
  );
}
