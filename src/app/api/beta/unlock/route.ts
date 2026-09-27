import { NextRequest, NextResponse } from "next/server";
import { BETA_COOKIE, isValidBetaCode } from "@/lib/betaAccess";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const code = String(body.code || "");

  if (!isValidBetaCode(code)) {
    return NextResponse.json({ error: "That access code is not valid." }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(BETA_COOKIE, "ok", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
  return response;
}
