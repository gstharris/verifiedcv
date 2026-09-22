import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { experienceId, otpCode } = await req.json();

    if (!experienceId || !otpCode) {
      return NextResponse.json({ error: "Missing verification parameters." }, { status: 400 });
    }

    // Look up active OTP
    const { data: record, error: fetchError } = await supabase
      .from("claim_domain_verifications")
      .select("*")
      .eq("experience_id", experienceId)
      .eq("otp_code", otpCode.trim())
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !record) {
      return NextResponse.json({ error: "Invalid or expired verification code." }, { status: 400 });
    }

    // Mark as verified
    await supabase
      .from("claim_domain_verifications")
      .update({ verified_at: new Date().toISOString() })
      .eq("id", record.id);

    // Update all claims under this experience to high fidelity verified status
    await supabase
      .from("claims")
      .update({
        pith_fidelity_score: 95,
        status: "DOMAIN_VERIFIED",
      })
      .eq("experience_id", experienceId);

    return NextResponse.json({
      success: true,
      domain: record.domain,
      verifiedAt: new Date().toISOString(),
      message: `Successfully verified corporate affiliation via @${record.domain}.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Verification failed." }, { status: 500 });
  }
}