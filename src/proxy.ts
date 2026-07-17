import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, isValidAuthToken } from "@/lib/auth";

// ログイン画面・ログインAPI・静的アセットは認証チェックの対象外にする
export const config = {
  matcher: [
    "/((?!login|api/auth/login|_next/static|_next/image|favicon.ico).*)",
  ],
};

// 全ページ・全APIをパスコード認証で保護する(設計書9章)
// Next.js 16では middleware.ts ではなく proxy.ts が正しいファイル名・関数名
export function proxy(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (isValidAuthToken(token)) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  return NextResponse.redirect(new URL("/login", request.url));
}
