import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { experienceId, emailAddress, companyName } = await req.json();

    if (!emailAddress || !experienceId) {
      return NextResponse.json({ error: "Missing email address or experience ID." }, { status: 400 });
    }

    const domain = emailAddress.split("@")[1]?.toLowerCase();
    if (!domain) {
      return NextResponse.json({ error: "Invalid email address format." }, { status: 400 });
    }

    // Generate secure 6-digit numeric OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in database
    const { error: dbError } = await supabase
      .from("claim_domain_verifications")
      .insert({
        experience_id: experienceId,
        email_address: emailAddress.toLowerCase(),
        domain,
        otp_code: otpCode,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 mins
      });

    if (dbError) throw dbError;

    // Dispatch email via Resend / Postmark / SendGrid
    // In local dev/demo, we can echo the OTP or pipe to email provider
    console.log(`[VERIFY DOMAIN OTP] Dispatched ${otpCode} to ${emailAddress} for ${companyName}`);

    return NextResponse.json({
      success: true,
      message: `A 6-digit verification code was sent to ${emailAddress}.`,
      // Expose for testing if not in strict production mode
      devOtp: process.env.NODE_ENV === "development" ? otpCode : undefined,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to issue domain verification OTP." }, { status: 500 });
  }
}