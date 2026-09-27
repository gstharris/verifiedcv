import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

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
  "settings",
  "attest",
  "mock-linkedin"
]);

export async function GET(req: NextRequest) {
  const handle = (new URL(req.url).searchParams.get("handle") || "").toLowerCase().trim();

  if (!handle || handle.length < 2) {
    return NextResponse.json({ available: false, error: "Handle too short" }, { status: 400 });
  }

  if (RESERVED_HANDLES.has(handle)) {
    return NextResponse.json({ available: false, reason: "reserved" });
  }

  const supabase = getSupabase();
  if (supabase) {
    const { data } = await supabase.from("candidates").select("handle").eq("handle", handle).maybeSingle();
    if (data?.handle) {
      return NextResponse.json({ available: false, handle, reason: "taken" });
    }
  }

  return NextResponse.json({ available: true, handle });
}
