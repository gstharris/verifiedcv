import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { searchParams } = new URL(req.url);
    const candidateHandle = searchParams.get("handle");

    if (!candidateHandle) {
      return NextResponse.json(
        { success: false, error: "handle query param is required." },
        { status: 400 }
      );
    }

    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from("attestation_invites")
        .select("*")
        .eq("candidate_handle", candidateHandle)
        .order("created_at", { ascending: false });

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, invites: data || [] });
    }

    return NextResponse.json({ success: true, invites: [] });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error." },
      { status: 500 }
    );
  }
}