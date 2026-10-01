import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getVaultStore, saveToVaultStore } from "@/lib/store";
import { BETA_COOKIE, isBetaEnforced } from "@/lib/betaAccess";
import { getAppUrl } from "@/lib/appUrl";
import {
  applyHandleOwnerCookie,
  authorizeVaultWrite,
  getHandleOwnerFromRequest,
  hashOwnerToken
} from "@/lib/handleOwner";
import { issueRestoreCode } from "@/lib/handleRestore";

export const dynamic = "force-dynamic";

const CANDIDATE_PUBLIC_COLUMNS =
  "handle, full_name, headline, summary_statement, bio_summary, email, phone, linkedin, location, email_verified, phone_verified, linkedin_verified";

function stripOwnerSecret(record: Record<string, unknown>) {
  const rest = { ...record };
  delete rest.ownerTokenHash;
  delete rest.owner_token_hash;
  return rest;
}

function missingOwnerColumn(message?: string) {
  return Boolean(message && message.toLowerCase().includes("owner_token_hash"));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const handle = (searchParams.get("handle") || "").toLowerCase().trim();

  if (!handle) {
    return NextResponse.json({ error: "Handle parameter required." }, { status: 400 });
  }

  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const { data: candidate, error: candidateError } = await supabase
        .from("candidates")
        .select(CANDIDATE_PUBLIC_COLUMNS)
        .eq("handle", handle)
        .single();

      if (candidate && !candidateError) {
        const [milestonesRes, educationRes, skillsRes] = await Promise.all([
          supabase.from("milestones").select("*, artifacts(*), registry_links(*), verifications(*)").eq("candidate_handle", handle),
          supabase.from("education").select("*").eq("candidate_handle", handle),
          supabase.from("skills").select("*").eq("candidate_handle", handle)
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
          skills: skillsRes.data?.map((s) => s.skill) || [],
          education: educationRes.data || [],
          milestones:
            milestonesRes.data?.map((m) => ({
              id: m.id,
              company: m.company,
              role: m.role,
              period: m.period,
              location: m.location,
              claims: m.claims,
              calibratedClaim: m.calibrated_claim,
              artifacts: m.artifacts || [],
              registryLinks: (m.registry_links || []).map((l: { id: string; type: string; url: string; label: string }) => ({
                id: l.id,
                type: l.type,
                url: l.url,
                label: l.label
              })),
              verifications: (m.verifications || []).map(
                (v: {
                  id: string;
                  name: string;
                  role: string;
                  email: string;
                  linkedin_url?: string;
                  linkedInUrl?: string;
                  verified_at?: string;
                  verifiedAt?: string;
                }) => ({
                  id: v.id,
                  name: v.name,
                  role: v.role,
                  email: v.email,
                  linkedInUrl: v.linkedin_url || v.linkedInUrl,
                  verifiedAt: v.verified_at || v.verifiedAt
                })
              )
            })) || []
        };

        return NextResponse.json(record);
      }
    } catch (err) {
      console.error("Supabase GET error:", err);
    }
  }

  const store = getVaultStore();
  const record = store[handle];

  if (!record) {
    return NextResponse.json({ error: "Handle not found in Vault." }, { status: 404 });
  }

  return NextResponse.json(stripOwnerSecret(record));
}

export async function POST(req: NextRequest) {
  try {
    if (isBetaEnforced() && req.cookies.get(BETA_COOKIE)?.value !== "ok") {
      return NextResponse.json({ error: "Private beta. Studio access is required." }, { status: 401 });
    }

    const payload = await req.json();
    const handle = (payload.handle || "").toLowerCase().trim();
    const incomingEmail = String(payload.contact?.email || payload.email || "").toLowerCase().trim();

    if (!handle || !payload.fullName) {
      return NextResponse.json(
        { error: "Handle and full name are required to commit to Vault." },
        { status: 400 }
      );
    }

    const cookie = getHandleOwnerFromRequest(req);
    let tokenToSet: string | null = null;
    let isNewClaim = false;
    let restoreEmailed = false;

    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        const { data: existing, error: existingError } = await supabase
          .from("candidates")
          .select("handle, email, owner_token_hash")
          .eq("handle", handle)
          .maybeSingle();

        if (existingError && !missingOwnerColumn(existingError.message)) {
          console.error("Supabase owner lookup error:", existingError);
          return NextResponse.json({ error: existingError.message }, { status: 500 });
        }

        if (!existingError || !missingOwnerColumn(existingError.message)) {
          const decision = authorizeVaultWrite({
            handle,
            incomingEmail,
            existing: existing?.handle ? existing : null,
            cookie
          });
          if (!decision.ok) {
            return NextResponse.json({ error: decision.error, code: "HANDLE_OWNED" }, { status: 403 });
          }
          tokenToSet = decision.tokenToSet;
          isNewClaim = decision.isNewClaim;
        }

        if (!existing?.handle && incomingEmail) {
          const { data: byEmail } = await supabase
            .from("candidates")
            .select("handle, email")
            .ilike("email", incomingEmail)
            .maybeSingle();
          if (byEmail?.handle && byEmail.handle !== handle) {
            return NextResponse.json(
              {
                error: `This email already has a page at verifiedcv.app/${byEmail.handle}. Use that handle, or email a restore code if this is a new browser.`,
                code: "EMAIL_TAKEN",
                handle: byEmail.handle
              },
              { status: 409 }
            );
          }
        }

        const { error: candidateError } = await supabase.from("candidates").upsert(
          {
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
          },
          { onConflict: "handle" }
        );

        if (candidateError) {
          console.error("Supabase candidate upsert error:", candidateError);
          if (/candidates_email_key|email.*unique/i.test(candidateError.message || "")) {
            const { data: byEmail } = incomingEmail
              ? await supabase.from("candidates").select("handle").ilike("email", incomingEmail).maybeSingle()
              : { data: null };
            const taken = byEmail?.handle ? `verifiedcv.app/${byEmail.handle}` : "another handle";
            return NextResponse.json(
              {
                error: `This email already has a page at ${taken}. Use that handle, or email a restore code if this is a new browser.`,
                code: "EMAIL_TAKEN",
                handle: byEmail?.handle || null
              },
              { status: 409 }
            );
          }
          return NextResponse.json({ error: candidateError.message }, { status: 500 });
        }

        if (tokenToSet) {
          const { error: ownerError } = await supabase
            .from("candidates")
            .update({ owner_token_hash: hashOwnerToken(tokenToSet) })
            .eq("handle", handle);
          if (ownerError && !missingOwnerColumn(ownerError.message)) {
            console.error("Could not store handle owner token:", ownerError.message);
          }
        }

        const linkedInSub = String(payload.linkedinSub || "").trim();
        if (linkedInSub) {
          const { error: subError } = await supabase
            .from("candidates")
            .update({ linkedin_sub: linkedInSub })
            .eq("handle", handle);
          if (subError) {
            console.error("Could not store LinkedIn account id:", subError.message);
          }
        }

        const { data: candidateRow } = await supabase.from("candidates").select("id").eq("handle", handle).maybeSingle();

        await supabase.from("skills").delete().eq("candidate_handle", handle);
        if (payload.skills && payload.skills.length > 0) {
          await supabase.from("skills").insert(payload.skills.map((skill: string) => ({ candidate_handle: handle, skill })));
        }

        await supabase.from("education").delete().eq("candidate_handle", handle);
        if (payload.education && payload.education.length > 0) {
          await supabase.from("education").insert(
            payload.education.map((edu: { id?: string; institution: string; degree: string; year?: string }) => ({
              id: edu.id || `edu-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              candidate_handle: handle,
              institution: edu.institution,
              degree: edu.degree,
              year: edu.year
            }))
          );
        }

        const incomingMilestones = Array.isArray(payload.milestones) ? payload.milestones : [];
        const incomingIds = incomingMilestones.map((m: { id?: string }) => m.id).filter(Boolean);
        const { data: existingMilestones } = await supabase.from("milestones").select("id").eq("candidate_handle", handle);
        const staleIds = (existingMilestones || []).map((row) => row.id).filter((id) => !incomingIds.includes(id));
        if (staleIds.length > 0) {
          await supabase.from("milestones").delete().in("id", staleIds);
        }

        for (const m of incomingMilestones) {
          const milestoneId = m.id || `m-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

          await supabase.from("milestones").upsert({
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

          await supabase.from("artifacts").delete().eq("milestone_id", milestoneId);
          if (m.artifacts && m.artifacts.length > 0) {
            await supabase.from("artifacts").insert(
              m.artifacts.map((a: { id?: string; name: string; type: string }) => ({
                id: a.id || `art-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                milestone_id: milestoneId,
                name: a.name,
                type: a.type
              }))
            );
          }

          await supabase.from("registry_links").delete().eq("milestone_id", milestoneId);
          if (m.registryLinks && m.registryLinks.length > 0) {
            await supabase.from("registry_links").insert(
              m.registryLinks.map((l: { id?: string; type: string; url: string; label: string }) => ({
                id: l.id || `reg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                milestone_id: milestoneId,
                type: l.type,
                url: l.url,
                label: l.label
              }))
            );
          }

          if (m.verifications && m.verifications.length > 0) {
            const { data: existingVers } = await supabase.from("verifications").select("id").eq("milestone_id", milestoneId);
            const existingIds = new Set((existingVers || []).map((row) => row.id));
            const fresh = m.verifications.filter((v: { id?: string }) => v.id && !existingIds.has(v.id));
            if (fresh.length > 0) {
              await supabase.from("verifications").insert(
                fresh.map((v: { id: string; name: string; role: string; email: string; linkedInUrl?: string; verifiedAt?: string }) => ({
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

        if (isNewClaim && incomingEmail) {
          const issued = await issueRestoreCode(supabase, handle, incomingEmail);
          restoreEmailed = issued.ok;
          if (!issued.ok) {
            console.warn("Restore email was not sent:", issued.error);
          }
        }
      } catch (err) {
        console.error("Supabase POST error:", err);
        const message = err instanceof Error ? err.message : "Vault commit error";
        return NextResponse.json({ error: message }, { status: 500 });
      }
    } else {
      const store = getVaultStore();
      const existing = store[handle];
      const decision = authorizeVaultWrite({
        handle,
        incomingEmail,
        existing: existing
          ? { email: existing.contact?.email || existing.email, owner_token_hash: existing.ownerTokenHash }
          : null,
        cookie
      });
      if (!decision.ok) {
        return NextResponse.json({ error: decision.error, code: "HANDLE_OWNED" }, { status: 403 });
      }
      tokenToSet = decision.tokenToSet;
      isNewClaim = decision.isNewClaim;
    }

    const dossierRecord: Record<string, unknown> = {
      ...payload,
      handle,
      updatedAt: new Date().toISOString()
    };
    delete dossierRecord.owner_token_hash;
    delete dossierRecord.ownerTokenHash;
    if (tokenToSet) {
      dossierRecord.ownerTokenHash = hashOwnerToken(tokenToSet);
    }

    saveToVaultStore(handle, dossierRecord);

    const response = NextResponse.json({
      success: true,
      handle,
      restoreEmailed,
      dossierUrl: `${getAppUrl()}/${handle}`
    });
    if (tokenToSet) {
      applyHandleOwnerCookie(response, { handle, token: tokenToSet });
    }
    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Vault commit error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
