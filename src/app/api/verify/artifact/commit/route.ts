import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const {
      experienceId,
      artifactType,
      sha256Hash,
      ocrData,
      trustDelta,
      storageUrl,
    } = await req.json();

    if (!experienceId || !sha256Hash) {
      return NextResponse.json({ error: "Missing experience or hash." }, { status: 400 });
    }

    // 1. Insert into claim_artifacts
    const { data: artifact, error: insertError } = await supabase
      .from("claim_artifacts")
      .insert({
        experience_id: experienceId,
        artifact_type: artifactType,
        storage_url: storageUrl || "vault://redacted_local_hash",
        file_hash_sha256: sha256Hash,
        ocr_extracted_data: ocrData,
        trust_delta_applied: trustDelta,
        status: "MATCHED",
        is_publicly_visible: true,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // 2. Fetch current company claims and apply incremental confidence bump
    const { data: claims } = await supabase
      .from("claims")
      .select("id, pith_fidelity_score")
      .eq("experience_id", experienceId);

    if (claims && claims.length > 0) {
      for (const claim of claims) {
        // Increment score without exceeding 70% (Tier 1 baseline limit for artifacts + AI)
        const updatedScore = Math.min((claim.pith_fidelity_score || 45) + trustDelta, 70);
        await supabase
          .from("claims")
          .update({ pith_fidelity_score: updatedScore })
          .eq("id", claim.id);
      }
    }

    return NextResponse.json({
      success: true,
      artifact,
      message: `Artifact authenticated. Added +${trustDelta}% baseline proof across this role.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to commit artifact." },
      { status: 500 }
    );
  }
}