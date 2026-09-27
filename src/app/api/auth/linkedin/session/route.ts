import { NextRequest, NextResponse } from "next/server";
import { getLinkedInSessionFromRequest } from "@/lib/linkedin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const profile = getLinkedInSessionFromRequest(req);
  if (!profile) {
    return NextResponse.json({ authenticated: false });
  }

  return NextResponse.json({
    authenticated: true,
    profile
  });
}
