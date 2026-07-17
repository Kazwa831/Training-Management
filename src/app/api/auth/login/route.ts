import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import {
  AUTH_COOKIE_MAX_AGE_SECONDS,
  AUTH_COOKIE_NAME,
  isCorrectPasscode,
  issueAuthToken,
} from "@/lib/auth";

const requestBodySchema = z.object({
  passcode: z.string().min(1, "パスコードを入力してください"),
});

export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);
  const parsed = requestBodySchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "パスコードを入力してください" },
      { status: 400 },
    );
  }

  if (!isCorrectPasscode(parsed.data.passcode)) {
    return NextResponse.json(
      { error: "パスコードが違います" },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(AUTH_COOKIE_NAME, issueAuthToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
    path: "/",
  });
  return response;
}
