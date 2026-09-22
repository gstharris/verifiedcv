import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { attestationId } = await req.json();

    if (!attestationId) {
      return NextResponse.json({ error: "attestationId required" }, { status: 400 });
    }

    const { data: att, error: fetchErr } = await supabaseAdmin
      .from("claim_attestations")
      .select("*, experiences(company_name), profiles:candidate_id(full_name)")
      .eq("id", attestationId)
      .single();

    if (fetchErr || !att) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const currentReminders = att.reminder_count || 0;

    const { error: updateErr } = await supabaseAdmin
      .from("claim_attestations")
      .update({
        reminder_count: currentReminders + 1,
        last_reminded_at: new Date().toISOString(),
      })
      .eq("id", attestationId);

    if (updateErr) throw updateErr;

    const targetLabel = att.target_name || att.target_email || "corroborator";

    return NextResponse.json({
      success: true,
      message: `Nudge recorded for ${targetLabel}.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}