import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { experienceId, rawBullet, metricSummary, category } = await req.json();

    if (!rawBullet) {
      return NextResponse.json({ error: "Achievement text is required." }, { status: 400 });
    }

    // Default profile fallback
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("handle", "gharris")
      .single();

    const userId = profile?.id;

    const { data: claim, error: insertErr } = await supabaseAdmin
      .from("claims")
      .insert({
        experience_id: experienceId || null,
        user_id: userId,
        raw_bullet: rawBullet,
        metric_summary: metricSummary || null,
        category: category || "METRIC",
        pith_fidelity_score: 45,
        status: "DRAFT",
        is_manual: true,
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    return NextResponse.json({ success: true, claim });
  } catch (err: any) {
    console.error("Manual Achievement Save Error:", err);
    return NextResponse.json({ error: err.message || "Failed to persist achievement." }, { status: 500 });
  }
}