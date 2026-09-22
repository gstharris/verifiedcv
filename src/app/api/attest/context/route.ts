import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    // 1. Fetch attestation record with parent experience and candidate info
    const { data: record, error: recordErr } = await supabaseAdmin
      .from("claim_attestations")
      .select("*, experiences(*), profiles:candidate_id(full_name)")
      .eq("token", token)
      .single();

    if (recordErr || !record) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 404 });
    }

    // 2. Fetch all claims belonging to this experience
    const { data: allClaims, error: claimsErr } = await supabaseAdmin
      .from("claims")
      .select("id, raw_bullet, metric_summary, category, pith_fidelity_score, status")
      .eq("experience_id", record.experience_id);

    if (claimsErr) throw claimsErr;

    // Separate into requested focus vs. additional optional
    const requestedIds = Array.isArray(record.confirmed_claim_ids) && record.confirmed_claim_ids.length > 0
      ? record.confirmed_claim_ids
      : record.primary_claim_id ? [record.primary_claim_id] : [];

    const requestedClaims = allClaims?.filter((c) => requestedIds.includes(c.id)) || [];
    const otherClaims = allClaims?.filter((c) => !requestedIds.includes(c.id)) || [];

    return NextResponse.json({
      success: true,
      data: {
        candidate_name: record.profiles?.full_name || "The Candidate",
        company_name: record.experiences?.company_name || "Company",
        role_title: record.experiences?.title || "Role",
        role_start: record.experiences?.start_date,
        role_end: record.experiences?.end_date || "Present",
        relationship: record.relationship,
        target_name: record.target_name,
        target_email: record.target_email,
        status: record.status,
        requested_claims: requestedClaims.length > 0 ? requestedClaims : (allClaims || []),
        other_claims: otherClaims,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}