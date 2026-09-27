import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { getSupabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const resend = new Resend(process.env.RESEND_API_KEY);

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
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }

  const code = sixDigitCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const { error } = await supabase.from("email_codes").upsert({
    email,
    code,
    expires_at: expiresAt
  });

  if (error) {
    return NextResponse.json({ error: "Could not create verification code." }, { status: 500 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "Email delivery is not configured." }, { status: 500 });
  }

  const { error: emailError } = await resend.emails.send({
    from: "VerifiedCV <verify@verifiedcv.app>",
    to: email,
    subject: "Your VerifiedCV email code",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Confirm your email</h2>
        <p>Your VerifiedCV confirmation code is:</p>
        <p style="font-size: 28px; font-weight: 800; letter-spacing: 4px;">${code}</p>
        <p style="color: #64748b; font-size: 12px;">This code expires in 10 minutes.</p>
      </div>
    `
  });

  if (emailError) {
    return NextResponse.json({ error: "Could not send the verification email." }, { status: 500 });
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

  if (!email || !code) {
    return NextResponse.json({ error: "Email and code are required." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("email_codes")
    .select("*")
    .eq("email", email)
    .eq("code", code)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "That code is incorrect." }, { status: 400 });
  }

  if (new Date(data.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "That code has expired. Request a new one." }, { status: 400 });
  }

  await supabase.from("email_codes").delete().eq("email", email);
  return NextResponse.json({ success: true });
}
