import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = await req.json();
    const { handle, experienceId, claim } = body || {};

    if (!handle || !experienceId || !claim?.raw_bullet) {
      return NextResponse.json(
        { success: false, error: "handle, experienceId, and claim.raw_bullet are required." },
        { status: 400 }
      );
    }

    const claimId = claim.id || crypto.randomUUID();

    if (supabaseAdmin) {
      await supabaseAdmin.from("claims").upsert({
        id: claimId,
        candidate_handle: handle,
        experience_id: experienceId,
        raw_bullet: claim.raw_bullet,
        metric_summary: claim.metric_summary || "",
        category: claim.category || "EXECUTION",
        pith_fidelity_score: claim.pith_fidelity_score || 72,
        status: claim.status || "DRAFT",
        updated_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      claimId,
      status: "SAVED",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error." },
      { status: 500 }
    );
  }
}