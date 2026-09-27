import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getVaultStore, saveToVaultStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const handle = (searchParams.get("handle") || "").toLowerCase().trim();

  if (!handle) {
    return NextResponse.json({ error: "Handle parameter required." }, { status: 400 });
  }

  // Try Supabase first
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const { data: candidate, error: candidateError } = await supabase
        .from('candidates')
        .select('*')
        .eq('handle', handle)
        .single();

      if (candidate && !candidateError) {
        // Fetch related data
        const [milestonesRes, educationRes, skillsRes] = await Promise.all([
          supabase.from('milestones').select('*, artifacts(*), registry_links(*), verifications(*)').eq('candidate_handle', handle),
          supabase.from('education').select('*').eq('candidate_handle', handle),
          supabase.from('skills').select('*').eq('candidate_handle', handle)
        ]);

        const record = {
          handle: candidate.handle,
          fullName: candidate.full_name,
          headline: candidate.headline,
          summaryStatement: candidate.summary_statement || candidate.bio_summary,
          contact: {
            email: candidate.email,
            phone: candidate.phone,
            linkedin: candidate.linkedin,
            location: candidate.location,
            emailVerified: candidate.email_verified,
            phoneVerified: candidate.phone_verified,
            linkedinVerified: candidate.linkedin_verified
          },
          skills: skillsRes.data?.map(s => s.skill) || [],
          education: educationRes.data || [],
          milestones: milestonesRes.data?.map((m) => ({
          id: m.id,
          company: m.company,
          role: m.role,
          period: m.period,
          location: m.location,
          claims: m.claims,
          calibratedClaim: m.calibrated_claim,
          artifacts: m.artifacts || [],
          registryLinks: (m.registry_links || []).map((l: any) => ({
            id: l.id,
            type: l.type,
            url: l.url,
            label: l.label
          })),
          verifications: (m.verifications || []).map((v: any) => ({
            id: v.id,
            name: v.name,
            role: v.role,
            email: v.email,
            linkedInUrl: v.linkedin_url || v.linkedInUrl,
            verifiedAt: v.verified_at || v.verifiedAt
          }))
        })) || []
        };
        
        return NextResponse.json(record);
      }
    } catch (err) {
      console.error("Supabase GET error:", err);
    }
  }

  // Fallback to local store
  const store = getVaultStore();
  const record = store[handle];
  
  if (!record) {
    return NextResponse.json({ error: "Handle not found in Vault." }, { status: 404 });
  }

  return NextResponse.json(record);
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const handle = (payload.handle || "").toLowerCase().trim();

    if (!handle || !payload.fullName) {
      return NextResponse.json(
        { error: "Handle and full name are required to commit to Vault." },
        { status: 400 }
      );
    }

    // Try Supabase first
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        const { error: candidateError } = await supabase
          .from('candidates')
          .upsert({
            handle,
            full_name: payload.fullName,
            headline: payload.headline,
            summary_statement: payload.summaryStatement,
            bio_summary: payload.summaryStatement,
            email: payload.contact?.email || "",
            phone: payload.contact?.phone,
            linkedin: payload.contact?.linkedin,
            location: payload.contact?.location,
            email_verified: payload.contact?.emailVerified || false,
            phone_verified: payload.contact?.phoneVerified || false,
            linkedin_verified: payload.contact?.linkedinVerified || false,
            updated_at: new Date().toISOString()
          }, { onConflict: "handle" });

        if (candidateError) {
          console.error("Supabase candidate upsert error:", candidateError);
          return NextResponse.json({ error: candidateError.message }, { status: 500 });
        }

        const { data: candidateRow } = await supabase
          .from("candidates")
          .select("id")
          .eq("handle", handle)
          .maybeSingle();

        await supabase.from('skills').delete().eq('candidate_handle', handle);
        if (payload.skills && payload.skills.length > 0) {
          await supabase.from('skills').insert(
            payload.skills.map((skill: string) => ({ candidate_handle: handle, skill }))
          );
        }

        await supabase.from('education').delete().eq('candidate_handle', handle);
        if (payload.education && payload.education.length > 0) {
          await supabase.from('education').insert(
            payload.education.map((edu: any) => ({
              id: edu.id || `edu-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              candidate_handle: handle,
              institution: edu.institution,
              degree: edu.degree,
              year: edu.year
            }))
          );
        }

        const incomingMilestones = Array.isArray(payload.milestones) ? payload.milestones : [];
        const incomingIds = incomingMilestones.map((m: any) => m.id).filter(Boolean);
        const { data: existingMilestones } = await supabase
          .from('milestones')
          .select('id')
          .eq('candidate_handle', handle);
        const staleIds = (existingMilestones || [])
          .map((row) => row.id)
          .filter((id) => !incomingIds.includes(id));
        if (staleIds.length > 0) {
          await supabase.from('milestones').delete().in('id', staleIds);
        }

        for (const m of incomingMilestones) {
          const milestoneId = m.id || `m-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

          await supabase.from('milestones').upsert({
            id: milestoneId,
            candidate_handle: handle,
            candidate_id: candidateRow?.id || null,
            company: m.company,
            role: m.role,
            period: m.period,
            location: m.location,
            claims: m.claims || [],
            calibrated_claim: m.calibratedClaim || ""
          });

          await supabase.from('artifacts').delete().eq('milestone_id', milestoneId);
          if (m.artifacts && m.artifacts.length > 0) {
            await supabase.from('artifacts').insert(
              m.artifacts.map((a: any) => ({
                id: a.id || `art-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                milestone_id: milestoneId,
                name: a.name,
                type: a.type
              }))
            );
          }

          await supabase.from('registry_links').delete().eq('milestone_id', milestoneId);
          if (m.registryLinks && m.registryLinks.length > 0) {
            await supabase.from('registry_links').insert(
              m.registryLinks.map((l: any) => ({
                id: l.id || `reg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                milestone_id: milestoneId,
                type: l.type,
                url: l.url,
                label: l.label
              }))
            );
          }

          if (m.verifications && m.verifications.length > 0) {
            const { data: existingVers } = await supabase
              .from('verifications')
              .select('id')
              .eq('milestone_id', milestoneId);
            const existingIds = new Set((existingVers || []).map((row) => row.id));
            const fresh = m.verifications.filter((v: any) => v.id && !existingIds.has(v.id));
            if (fresh.length > 0) {
              await supabase.from('verifications').insert(
                fresh.map((v: any) => ({
                  id: v.id,
                  milestone_id: milestoneId,
                  name: v.name,
                  role: v.role,
                  email: v.email,
                  linkedin_url: v.linkedInUrl,
                  verified_at: v.verifiedAt || new Date().toISOString()
                }))
              );
            }
          }
        }
      } catch (err) {
        console.error("Supabase POST error:", err);
        const message = err instanceof Error ? err.message : "Vault commit error";
        return NextResponse.json({ error: message }, { status: 500 });
      }
    }

    // Always fallback to local store for now to ensure MVP works
    const dossierRecord = {
      ...payload,
      handle,
      updatedAt: new Date().toISOString()
    };

    saveToVaultStore(handle, dossierRecord);

    return NextResponse.json({
      success: true,
      handle,
      dossierUrl: `https://verifiedcv.app/${handle}`
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Vault commit error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}