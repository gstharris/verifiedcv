import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { experiences, candidateHandle, candidateName } = await req.json();

    if (!experiences || !Array.isArray(experiences) || experiences.length === 0) {
      return NextResponse.json({ error: "Missing or invalid experiences array." }, { status: 400 });
    }

    const handle = candidateHandle || "gharris";
    const fullName = candidateName || "Graham Harris";

    // 1. Fetch or create candidate profile
    let { data: profile, error: profileErr } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("handle", handle)
      .maybeSingle();

    if (profileErr) throw profileErr;

    if (!profile) {
      const { data: newProfile, error: insertProfileErr } = await supabaseAdmin
        .from("profiles")
        .insert({
          handle,
          full_name: fullName,
          headline: "Technology & Product Leader",
          overall_pith_score: 45,
        })
        .select("id")
        .single();

      if (insertProfileErr) throw insertProfileErr;
      profile = newProfile;
    }

    const userId = profile.id;
    const committedExperiences = [];

    // 2. Persist experiences and their child claims
    for (const exp of experiences) {
      const { data: expRecord, error: expErr } = await supabaseAdmin
        .from("experiences")
        .insert({
          user_id: userId,
          company_name: exp.company_name,
          title: exp.title,
          start_date: exp.start_date,
          end_date: exp.end_date,
          is_current: exp.is_current ?? (!exp.end_date || exp.end_date.toLowerCase().includes("present")),
        })
        .select()
        .single();

      if (expErr) throw expErr;

      let committedClaims = [];
      if (exp.claims && exp.claims.length > 0) {
        const claimsToInsert = exp.claims.map((claim: any) => ({
          experience_id: expRecord.id,
          user_id: userId,
          raw_bullet: claim.raw_bullet,
          metric_summary: claim.metric_summary || null,
          category: claim.category || "EXECUTION",
          pith_fidelity_score: claim.pith_fidelity_score || 45,
          status: "DRAFT",
        }));

        const { data: insertedClaims, error: claimsErr } = await supabaseAdmin
          .from("claims")
          .insert(claimsToInsert)
          .select();

        if (claimsErr) throw claimsErr;
        committedClaims = insertedClaims || [];
      }

      committedExperiences.push({
        ...expRecord,
        claims: committedClaims,
      });
    }

    return NextResponse.json({
      success: true,
      profileId: userId,
      experiences: committedExperiences,
    });
  } catch (error: any) {
    console.error("Master Vault Persistence Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to commit experiences to database." },
      { status: 500 }
    );
  }
}