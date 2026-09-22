import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { experienceId, primaryClaimId, relationship, targetName, targetEmail } = await req.json();

    if (!experienceId || !relationship) {
      return NextResponse.json(
        { error: "experienceId and relationship are required" },
        { status: 400 }
      );
    }

    // 1. Verify experience exists and grab user_id
    const { data: experience, error: expErr } = await supabaseAdmin
      .from("experiences")
      .select("id, user_id, company_name")
      .eq("id", experienceId)
      .single();

    if (expErr || !experience) {
      return NextResponse.json({ error: "Experience not found" }, { status: 404 });
    }

    // 2. Generate secure token
    const token = crypto.randomBytes(24).toString("hex");

    // 3. Persist Corroboration Packet Invite
    const { data: invite, error: insertErr } = await supabaseAdmin
      .from("claim_attestations")
      .insert({
        experience_id: experience.id,
        claim_id: primaryClaimId || null,
        primary_claim_id: primaryClaimId || null,
        candidate_id: experience.user_id,
        token,
        scope: "COMPANY_BUNDLE",
        target_name: targetName || null,
        target_email: targetEmail || null,
        relationship: relationship.toUpperCase(),
        status: "PENDING",
      })
      .select("id, token, relationship")
      .single();

    if (insertErr) throw insertErr;

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const shareableUrl = `${baseUrl}/attest/${token}`;

    return NextResponse.json({
      success: true,
      inviteId: invite.id,
      token,
      shareableUrl,
      relationship: invite.relationship,
      companyName: experience.company_name,
    });
  } catch (err: any) {
    console.error("Attestation Invite Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create corroboration invite" },
      { status: 500 }
    );
  }
}