import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { getSupabase } from "@/lib/supabase";
import { corporateEmailMatchesCompany } from "@/lib/corporateEmail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getResendClient() {
  return new Resend(process.env.RESEND_API_KEY);
}

function sixDigitCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 500 });
  }

  const body = await req.json();
  const email = String(body.email || "").toLowerCase().trim();
  const milestoneId = String(body.milestoneId || "").trim();
  const companyName = String(body.companyName || "").trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }

  if (!milestoneId) {
    return NextResponse.json({ error: "Milestone ID is required." }, { status: 400 });
  }

  const domainCheck = corporateEmailMatchesCompany(companyName, email);
  if (!domainCheck.ok) {
    return NextResponse.json({ error: domainCheck.reason }, { status: 400 });
  }

  const code = sixDigitCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  // We reuse the email_codes table, but append the milestoneId to the email to keep it unique per milestone request
  const lookupKey = `${email}::${milestoneId}`;

  const { error } = await supabase.from("email_codes").upsert({
    email: lookupKey,
    code,
    expires_at: expiresAt
  });

  if (error) {
    return NextResponse.json({ error: error.message || "Could not create verification code." }, { status: 500 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "Email delivery is not configured." }, { status: 500 });
  }

  const resend = getResendClient();
  const { error: emailError } = await resend.emails.send({
    from: "VerifiedCV <verify@verifiedcv.app>",
    to: email,
    subject: `Verify your employment at ${companyName || "your company"}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Corporate Email Verification</h2>
        <p>Your VerifiedCV confirmation code for <strong>${companyName || "this company"}</strong> is:</p>
        <p style="font-size: 28px; font-weight: 800; letter-spacing: 4px;">${code}</p>
        <p style="color: #64748b; font-size: 12px;">This code expires in 10 minutes.</p>
      </div>
    `
  });

  if (emailError) {
    return NextResponse.json(
      { error: emailError.message || "Could not send the verification email." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}

export async function PUT(req: NextRequest) {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 500 });
  }

  const body = await req.json();
  const email = String(body.email || "").toLowerCase().trim();
  const code = String(body.code || "").trim();
  const milestoneId = String(body.milestoneId || "").trim();
  const companyName = String(body.companyName || "").trim();

  if (!email || !code || !milestoneId) {
    return NextResponse.json({ error: "Email, code, and milestone ID are required." }, { status: 400 });
  }

  if (companyName) {
    const domainCheck = corporateEmailMatchesCompany(companyName, email);
    if (!domainCheck.ok) {
      return NextResponse.json({ error: domainCheck.reason }, { status: 400 });
    }
  }

  const lookupKey = `${email}::${milestoneId}`;

  const { data, error } = await supabase
    .from("email_codes")
    .select("*")
    .eq("email", lookupKey)
    .eq("code", code)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "That code is incorrect." }, { status: 400 });
  }

  if (new Date(data.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "That code has expired. Request a new one." }, { status: 400 });
  }

  // Delete the code
  await supabase.from("email_codes").delete().eq("email", lookupKey);

  // Insert a verification record for this milestone
  const { error: insertError } = await supabase.from("verifications").insert({
    id: `ver-corp-${Date.now()}`,
    milestone_id: milestoneId,
    name: "Corporate Email Verification",
    role: "Automated System",
    email: email,
    linkedin_url: null,
    verified_at: new Date().toISOString()
  });

  if (insertError) {
    return NextResponse.json({ error: "Failed to save verification record." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
