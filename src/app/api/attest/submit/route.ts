import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const {
      token,
      verdict,
      authRail,
      attesterName,
      attesterTitle,
      attesterLinkedinUrl,
      attesterEmail,
      confirmedClaimIds, // Array of UUIDs the corroborator verified
      notes,
    } = await req.json();

    if (!token || !verdict || !attesterName) {
      return NextResponse.json(
        { error: "Token, your name, and corroboration decision are required" },
        { status: 400 }
      );
    }

    // 1. Fetch pending record
    const { data: record, error: findErr } = await supabaseAdmin
      .from("claim_attestations")
      .select("*")
      .eq("token", token)
      .single();

    if (findErr || !record) {
      return NextResponse.json({ error: "Corroboration link expired or invalid" }, { status: 404 });
    }

    if (record.status !== "PENDING") {
      return NextResponse.json(
        { error: "This corroboration packet has already been submitted." },
        { status: 400 }
      );
    }

    const isManager = record.relationship === "MANAGER";
    const isConfirmed = verdict === "CONFIRM";
    const claimIdsToUpdate = Array.isArray(confirmedClaimIds) && confirmedClaimIds.length > 0
      ? confirmedClaimIds
      : record.primary_claim_id ? [record.primary_claim_id] : [];

    const newScore = isConfirmed ? (isManager ? 100 : 85) : 45;
    const newStatus = isConfirmed
      ? (isManager ? "VERIFIED_MANAGER" : "VERIFIED_PEER")
      : "DISPUTED";

    // 2. Update the attestation packet record
    await supabaseAdmin
      .from("claim_attestations")
      .update({
        status: isConfirmed ? "CONFIRMED" : "DISPUTED",
        auth_rail: authRail || "LINKEDIN_OAUTH",
        attester_name: attesterName,
        attester_title: attesterTitle || null,
        attester_linkedin_url: attesterLinkedinUrl || null,
        attester_email: attesterEmail || null,
        confirmed_claim_ids: isConfirmed ? claimIdsToUpdate : [],
        verdict_notes: notes || null,
        company_overlap_confirmed: true,
        completed_at: new Date().toISOString(),
      })
      .eq("id", record.id);

    // 3. Batch update all verified claims in Supabase
    if (isConfirmed && claimIdsToUpdate.length > 0) {
      await supabaseAdmin
        .from("claims")
        .update({
          status: newStatus,
          pith_fidelity_score: newScore,
        })
        .in("id", claimIdsToUpdate);
    }

    return NextResponse.json({
      success: true,
      claimsVerifiedCount: claimIdsToUpdate.length,
      newScore,
      newStatus,
    });
  } catch (err: any) {
    console.error("Attestation Submit Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to submit corroboration" },
      { status: 500 }
    );
  }
}