import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { success: false, error: "token query param is required." },
        { status: 400 }
      );
    }

    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from("attestation_invites")
        .select("*")
        .eq("token", token)
        .single();

      if (error || !data) {
        return NextResponse.json({ success: false, error: "Attestation context not found." }, { status: 404 });
      }

      return NextResponse.json({ success: true, context: data });
    }

    return NextResponse.json({ success: false, error: "Database unavailable." }, { status: 503 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error." },
      { status: 500 }
    );
  }
}