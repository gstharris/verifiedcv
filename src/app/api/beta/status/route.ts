import { NextRequest, NextResponse } from "next/server";
import { BETA_COOKIE, betaAcceptsCode, isBetaEnforced } from "@/lib/betaAccess";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const locked = isBetaEnforced();
  const unlocked = req.cookies.get(BETA_COOKIE)?.value === "ok";
  return NextResponse.json({
    locked,
    unlocked,
    acceptsCode: betaAcceptsCode()
  });
}
