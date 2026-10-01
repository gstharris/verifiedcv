import { NextRequest, NextResponse } from "next/server";
import { getLinkedInSessionFromRequest } from "@/lib/linkedin";
import { assessLinkedInIdentity } from "@/lib/linkedinProfileGate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const profile = getLinkedInSessionFromRequest(req);
  if (!profile) {
    return NextResponse.json({ authenticated: false });
  }

  const gate = assessLinkedInIdentity(profile);
  return NextResponse.json({
    authenticated: true,
    usableForConfirm: gate.ok,
    confirmError: gate.ok ? null : gate.message,
    profile
  });
}
