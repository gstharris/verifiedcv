import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Reserved handles that cannot be registered
const RESERVED_HANDLES = new Set([
  "api",
  "studio",
  "admin",
  "vault",
  "login",
  "signup",
  "auth",
  "verified",
  "help",
  "pricing",
  "settings"
]);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const handle = (searchParams.get("handle") || "").toLowerCase().trim();

  if (!handle || handle.length < 2) {
    return NextResponse.json({ available: false, error: "Handle too short" }, { status: 400 });
  }

  if (RESERVED_HANDLES.has(handle)) {
    return NextResponse.json({ available: false, reason: "reserved" });
  }

  return NextResponse.json({ available: true, handle });
}