import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = await req.json();
    const { token, relationship, notes, attestorName, attestorTitle, isRoleMasked, endorsedClaimIds } = body || {};

    if (!token) {
      return NextResponse.json(
        { success: false, error: "token is required." },
        { status: 400 }
      );
    }

    const signature = "SIG_ATTEST_" + crypto.randomBytes(8).toString("hex");

    if (supabaseAdmin) {
      const { error } = await supabaseAdmin
        .from("attestation_invites")
        .update({
          status: "CONFIRMED",
          relationship: relationship || "PEER",
          notes: notes || "",
          attestor_name: attestorName || "Verified Colleague",
          attestor_title: attestorTitle || "Leader",
          is_role_masked: isRoleMasked ?? true,
          endorsed_claim_ids: endorsedClaimIds || [],
          signature,
          confirmed_at: new Date().toISOString(),
        })
        .eq("token", token);

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      signature,
      message: "Attestation confirmed.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error." },
      { status: 500 }
    );
  }
}