import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // 1. Fetch the default user profile
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("handle", "gharris")
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({ success: true, data: [] });
    }

    // 2. Fetch all pending corroborations for this candidate
    const { data: records, error } = await supabaseAdmin
      .from("claim_attestations")
      .select("id, token, relationship, target_name, target_email, status, created_at, reminder_count, experiences(company_name)")
      .eq("candidate_id", profile.id)
      .eq("status", "PENDING")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const mapped = (records || []).map((r: any) => ({
      id: r.id,
      token: r.token,
      relationship: r.relationship,
      target_name: r.target_name,
      target_email: r.target_email,
      status: r.status,
      created_at: r.created_at,
      reminder_count: r.reminder_count || 0,
      company_name: r.experiences?.company_name || "Company",
    }));

    return NextResponse.json({
      success: true,
      data: mapped,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}