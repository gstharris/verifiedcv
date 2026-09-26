import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = await req.json();
    const { candidateHandle, candidateName, experienceId, companyName, roleTitle, attestorEmail, claims } = body || {};

    if (!candidateHandle || !experienceId || !attestorEmail) {
      return NextResponse.json(
        { success: false, error: "candidateHandle, experienceId, and attestorEmail are required." },
        { status: 400 }
      );
    }

    const token = crypto.randomBytes(16).toString("hex");

    if (supabaseAdmin) {
      await supabaseAdmin.from("attestation_invites").insert({
        token,
        candidate_handle: candidateHandle,
        candidate_name: candidateName || "Candidate",
        experience_id: experienceId,
        company_name: companyName || "",
        role_title: roleTitle || "",
        attestor_email: attestorEmail.toLowerCase().trim(),
        claims: claims || [],
        status: "PENDING",
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      token,
      attestUrl: `/attest/${token}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error." },
      { status: 500 }
    );
  }
}