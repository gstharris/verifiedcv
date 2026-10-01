import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { toE164 } from "@/lib/phone";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function twilioConfigured() {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_VERIFY_SERVICE_SID
  );
}

function twilioAuthHeader() {
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const token = process.env.TWILIO_AUTH_TOKEN!;
  return `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`;
}

export async function POST(req: NextRequest) {
  if (!twilioConfigured()) {
    return NextResponse.json(
      { error: "Phone verification is not configured. Add Twilio Verify keys in Vercel." },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const phone = toE164(String(body.phone || ""));
  if (!phone) {
    return NextResponse.json({ error: "Enter a valid mobile number, including area code." }, { status: 400 });
  }

  const twilioRes = await fetch(
    `https://verify.twilio.com/v2/Services/${process.env.TWILIO_VERIFY_SERVICE_SID}/Verifications`,
    {
      method: "POST",
      headers: {
        Authorization: twilioAuthHeader(),
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({ To: phone, Channel: "sms" })
    }
  );
  const payload = await twilioRes.json();
  if (!twilioRes.ok) {
    return NextResponse.json(
      { error: payload.message || "Could not send the SMS code." },
      { status: 502 }
    );
  }

  return NextResponse.json({ success: true, phone });
}

export async function PUT(req: NextRequest) {
  if (!twilioConfigured()) {
    return NextResponse.json(
      { error: "Phone verification is not configured." },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const phone = toE164(String(body.phone || ""));
  const code = String(body.code || "").trim();
  if (!phone || !code) {
    return NextResponse.json({ error: "Phone and code are required." }, { status: 400 });
  }

  const twilioRes = await fetch(
    `https://verify.twilio.com/v2/Services/${process.env.TWILIO_VERIFY_SERVICE_SID}/VerificationCheck`,
    {
      method: "POST",
      headers: {
        Authorization: twilioAuthHeader(),
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({ To: phone, Code: code })
    }
  );
  const payload = await twilioRes.json();
  if (!twilioRes.ok || payload.status !== "approved") {
    return NextResponse.json({ error: "That code is incorrect or expired." }, { status: 400 });
  }

  const supabase = getSupabase();
  if (supabase) {
    const handle = String(body.handle || "").toLowerCase().trim();
    if (handle) {
      await supabase.from("candidates").update({ phone_verified: true, phone }).eq("handle", handle);
    } else {
      await supabase.from("candidates").update({ phone_verified: true, phone }).eq("phone", phone);
    }
  }

  return NextResponse.json({ success: true, phone });
}
