import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { handle, email, fullName, headline, milestones } = body;

    if (!handle || !email || !fullName) {
      return NextResponse.json(
        { error: "Handle, email, and full name are required." },
        { status: 400 }
      );
    }

    const cleanHandle = handle.toLowerCase().trim().replace(/[^a-z0-9_-]/g, "");
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      // Ephemeral fallback for local dev when Supabase env vars are pending
      return NextResponse.json({
        success: true,
        candidate: {
          id: "dev-session-id",
          handle: cleanHandle,
          fullName,
          email,
          headline: headline || "Professional Leader",
          vaultAuditHash: "0x" + Math.random().toString(16).substring(2, 10)
        },
        savedMilestonesCount: milestones?.length || 0,
        mode: "ephemeral"
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Upsert candidate profile
    const { data: candidate, error: candidateError } = await supabase
      .from("candidates")
      .upsert(
        {
          handle: cleanHandle,
          email: email.trim().toLowerCase(),
          full_name: fullName,
          headline: headline || "Professional Leader",
          vault_audit_hash: "0x" + Math.random().toString(16).substring(2, 10)
        },
        { onConflict: "handle" }
      )
      .select()
      .single();

    if (candidateError) {
      return NextResponse.json({ error: candidateError.message }, { status: 500 });
    }

    // 2. Insert milestones if provided
    if (milestones && milestones.length > 0) {
      const records = milestones.map((m: any) => ({
        candidate_id: candidate.id,
        company: m.company || "Career Chapter",
        role: m.role || "Leader",
        period: m.period || "Confirmed Tenure",
        calibrated_claim: m.calibratedClaim || m.claim || "",
        metrics: m.metrics || [],
        tier: m.tier || "tier_1_identity",
        is_corroborated: m.isCorroborated || false,
        corroboration: m.corroboration || null
      }));

      // Delete existing and insert fresh set for clean draft sync
      await supabase.from("milestones").delete().eq("candidate_id", candidate.id);
      await supabase.from("milestones").insert(records);
    }

    return NextResponse.json({
      success: true,
      candidate,
      savedMilestonesCount: milestones?.length || 0,
      mode: "persisted"
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Vault Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}