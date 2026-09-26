import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = await req.json();
    const { token } = body || {};

    if (!token) {
      return NextResponse.json(
        { success: false, error: "token is required." },
        { status: 400 }
      );
    }

    if (supabaseAdmin) {
      await supabaseAdmin
        .from("attestation_invites")
        .update({ last_reminded_at: new Date().toISOString() })
        .eq("token", token);
    }

    return NextResponse.json({
      success: true,
      message: "Reminder queued.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error." },
      { status: 500 }
    );
  }
}