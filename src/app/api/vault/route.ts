import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, supabase as rawSupabase } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/server";
import { clearFileDraftsAfterPublish, getVaultStore, saveToVaultStore } from "@/lib/store";
import { DOSSIER_DRAFTS_KEY, EXPLICIT_PUBLISH_HEADER, PUBLIC_CANDIDATE_COLUMNS, decideDraftCancel, discardedDraftPayload, draftDeleteIsMissingTable, parseDraftRevision, requestPublishesLive, publicVaultRecord } from "@/lib/dossierDraft";
import { publishEmailChoice } from "@/lib/publishResult";
import { BETA_COOKIE, isBetaEnforced } from "@/lib/betaAccess";
import { getAppUrl } from "@/lib/appUrl";
import {
  applyHandleOwnerCookie,
  authorizeVaultWrite,
  getHandleOwnerFromRequest,
  hashOwnerToken
} from "@/lib/handleOwner";
import { issueRestoreCode } from "@/lib/handleRestore";
import { linkedInProfileUrl, linkedInVerifiedForWrite, preferLinkedInProfile } from "@/lib/linkedin";
import { candidateSummary, decodeStoredHighlights, decodeStoredPage, encodeStoredPage, normalizePortfolioAsset, type PortfolioAsset } from "@/lib/portfolioAssets";
import { repairSkillList } from "@/lib/skills";
import { markPrivateNoStore } from "@/lib/httpCache";

export const dynamic = "force-dynamic";

function missingOwnerColumn(message?: string) {
  return Boolean(message && message.toLowerCase().includes("owner_token_hash"));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const personal = searchParams.get("mine") === "1";
  const respond = (body: unknown, status = 200) => {
    const response = NextResponse.json(body, { status });
    return personal ? markPrivateNoStore(response) : response;
  };
  let handle = (searchParams.get("handle") || "").toLowerCase().trim();

  if (personal) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return respond({ error: "Sign in first." }, 401);
    }
    const byUser = await rawSupabase.from("candidates").select("handle").eq("auth_user_id", user.id).maybeSingle();
    const byEmail = byUser.data?.handle || !user.email
      ? null
      : await rawSupabase.from("candidates").select("handle").ilike("email", user.email).maybeSingle();
    handle = String(byUser.data?.handle || byEmail?.data?.handle || "").toLowerCase().trim();
    if (!handle) {
      return respond({ error: "No portfolio yet." }, 404);
    }
  }

  if (!handle || handle === DOSSIER_DRAFTS_KEY) {
    return respond(
      { error: handle ? "Handle not found in Vault." : "Handle parameter required." },
      handle ? 404 : 400
    );
  }

  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const { data: candidate, error: candidateError } = await rawSupabase
        .from("candidates")
        .select(PUBLIC_CANDIDATE_COLUMNS)
        .eq("handle", handle)
        .single();

      if (candidate && !candidateError) {
        const [milestonesRes, educationRes, skillsRes, attestationsRes] = await Promise.all([
          rawSupabase.from("milestones").select("*, artifacts(*), registry_links(*), verifications(*)").eq("candidate_handle", handle),
          rawSupabase.from("education").select("*").eq("candidate_handle", handle),
          rawSupabase.from("skills").select("*").eq("candidate_handle", handle),
          rawSupabase
            .from("attestations")
            .select("milestone_id, endorsed_claim_ids, status")
            .eq("candidate_handle", handle)
            .eq("status", "CONFIRMED")
        ]);
        const assetsRes = await rawSupabase.from("portfolio_assets").select("*").eq("candidate_handle", handle);

        const endorsedByMilestone = new Map<string, string[]>();
        for (const row of attestationsRes.data || []) {
          const existing = endorsedByMilestone.get(row.milestone_id) || [];
          const next = Array.isArray(row.endorsed_claim_ids) ? row.endorsed_claim_ids : [];
          endorsedByMilestone.set(row.milestone_id, [...existing, ...next.map(String)]);
        }

        const storedPage = decodeStoredPage(candidate.bio_summary);
        const tableAssets = (assetsRes.error ? [] : assetsRes.data || [])
            .map((asset: {
              id: string;
              title: string;
              description?: string;
              url?: string;
              type: string;
              issuer?: string;
              issued_at?: string;
            }) =>
              normalizePortfolioAsset({
                id: asset.id,
                title: asset.title,
                description: asset.description,
                url: asset.url,
                type: asset.type as PortfolioAsset["type"],
                issuer: asset.issuer,
                issuedAt: asset.issued_at
              })
            )
            .filter(Boolean);
        const record = {
          handle: candidate.handle,
          fullName: candidate.full_name,
          headline: candidate.headline,
          summaryStatement: candidateSummary(candidate.summary_statement, candidate.bio_summary),
          highlights: storedPage ? storedPage.highlights : decodeStoredHighlights(candidate.bio_summary),
          preferredLayout: candidate.preferred_layout || "traditional",
          portfolioAssets: tableAssets.length ? tableAssets : storedPage?.assets || [],
          contact: {
            email: candidate.email,
            phone: candidate.phone,
            linkedin: linkedInProfileUrl(String(candidate.linkedin || "")) || "",
            location: candidate.location,
            emailVerified: candidate.email_verified,
            phoneVerified: candidate.phone_verified,
            linkedinVerified: Boolean(candidate.linkedin_verified) && Boolean(linkedInProfileUrl(String(candidate.linkedin || "")))
          },
          skills: repairSkillList(skillsRes.data?.map((s) => s.skill) || []),
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
              endorsedClaimIds: endorsedByMilestone.get(m.id) || [],
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

        return respond(record);
      }
    } catch (err) {
      console.error("Supabase GET error:", err);
    }
  }

  const store = getVaultStore();
  const record = store[handle];

  if (!record) {
    return respond({ error: "Handle not found in Vault." }, 404);
  }

  const stored = publicVaultRecord(record);
  if (Array.isArray(stored.skills)) stored.skills = repairSkillList(stored.skills);
  return respond(stored);
}

export async function POST(req: NextRequest) {
  try {
    if (isBetaEnforced() && req.cookies.get(BETA_COOKIE)?.value !== "ok") {
      return NextResponse.json({ error: "Private beta. Studio access is required." }, { status: 401 });
    }

    const payload = await req.json();
    const publishedDraftRevision = parseDraftRevision(
      payload && typeof payload === "object" ? (payload as { draftRevision?: unknown }).draftRevision : null
    );
    if (payload && typeof payload === "object") delete payload.draftRevision;
    let handle = (payload.handle || "").toLowerCase().trim();
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && (!handle || !String(payload.fullName || "").trim())) {
      try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: owned } = await rawSupabase
            .from("candidates")
            .select("handle, full_name")
            .eq("auth_user_id", user.id)
            .maybeSingle();
          const ownedHandle = String(owned?.handle || "").toLowerCase().trim();
          if (ownedHandle && (!handle || handle === ownedHandle)) {
            handle = handle || ownedHandle;
            if (!String(payload.fullName || "").trim() && owned?.full_name) {
              payload.fullName = owned.full_name;
            }
          }
        }
      } catch (lookupError) {
        console.error("Supabase owned page lookup error:", lookupError);
      }
    }
    payload.handle = handle;
    const incomingEmail = String(payload.contact?.email || payload.email || "").toLowerCase().trim();

    if (!handle || !payload.fullName) {
      return NextResponse.json(
        { error: "Handle and full name are required to commit to Vault." },
        { status: 400 }
      );
    }

    const cookie = getHandleOwnerFromRequest(req);
    let authUserId: string | null = null;
    let tokenToSet: string | null = null;
    let isNewClaim = false;
    let restoreEmailed = false;
    let emailNotice = "";
    let emailKept = false;

    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        authUserId = user?.id || null;

        const { data: existing, error: existingError } = await rawSupabase
          .from("candidates")
          .select("handle, email, linkedin, linkedin_verified, owner_token_hash, auth_user_id, email_verified")
          .eq("handle", handle)
          .maybeSingle();

        if (existingError && !missingOwnerColumn(existingError.message)) {
          console.error("Supabase owner lookup error:", existingError);
          return NextResponse.json({ error: existingError.message }, { status: 500 });
        }

        if (!existingError || !missingOwnerColumn(existingError.message)) {
          if (existing?.handle) {
            // If the handle exists, check ownership
            if (existing.auth_user_id) {
              // It's claimed by a Supabase Auth user
              if (!user || user.id !== existing.auth_user_id) {
                return NextResponse.json({ error: "This handle is owned by another Google account.", code: "HANDLE_OWNED" }, { status: 403 });
              }
              // If user.id matches, they own it, proceed.
            } else {
              // It's a legacy handle claimed via cookies/email before Supabase Auth.
              // We need to verify their cookie/email to let them claim it with their new Google Auth.
              const decision = authorizeVaultWrite({
                handle,
                incomingEmail,
                existing: existing,
                cookie
              });
              if (!decision.ok) {
                return NextResponse.json({ error: decision.error, code: "HANDLE_OWNED" }, { status: 403 });
              }
              // If they proved ownership via cookie/email, we will attach their new user.id during upsert.
            }
          } else {
            // New handle claim
            if (user) {
              isNewClaim = true;
            } else {
              // Fallback for new claims if they somehow bypassed auth
              const decision = authorizeVaultWrite({
                handle,
                incomingEmail,
                existing: null,
                cookie
              });
              if (!decision.ok) {
                return NextResponse.json({ error: decision.error, code: "HANDLE_OWNED" }, { status: 403 });
              }
              tokenToSet = decision.tokenToSet;
              isNewClaim = decision.isNewClaim;
            }
          }
        }

        if (existing?.handle && !requestPublishesLive(req.headers.get(EXPLICIT_PUBLISH_HEADER), payload)) {
          return NextResponse.json(
            { error: "This dossier is already live. Use Publish changes to update it." },
            { status: 409 }
          );
        }

        if (!existing?.handle && incomingEmail) {
          const { data: byEmail } = await rawSupabase
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

        let emailForWrite = String(payload.contact?.email || "");
        let emailVerifiedForWrite = Boolean(payload.contact?.emailVerified);
        if (existing?.handle && incomingEmail && incomingEmail !== String(existing.email || "").toLowerCase().trim()) {
          const { data: byEmail } = await rawSupabase
            .from("candidates")
            .select("handle")
            .ilike("email", incomingEmail)
            .maybeSingle();
          const choice = publishEmailChoice({
            existingHandle: handle,
            existingEmail: String(existing.email || ""),
            incomingEmail,
            takenByHandle: String(byEmail?.handle || "")
          });
          if (choice.kept) {
            emailForWrite = choice.email;
            emailVerifiedForWrite = Boolean(existing.email_verified);
            emailNotice = choice.notice;
            emailKept = true;
            payload.email = choice.email;
            if (payload.contact && typeof payload.contact === "object") {
              payload.contact.email = choice.email;
              payload.contact.emailVerified = emailVerifiedForWrite;
            }
          }
        }

        const linkedinForWrite = preferLinkedInProfile(String(existing?.linkedin || ""), String(payload.contact?.linkedin || ""));
        const candidateRowForWrite = (email: string, emailVerified: boolean) => ({
          handle,
          full_name: payload.fullName,
          headline: payload.headline,
          summary_statement: payload.summaryStatement,
          bio_summary: encodeStoredPage({
            highlights: payload.highlights,
            portfolioAssets: payload.portfolioAssets
          }) || payload.summaryStatement,
          email,
          phone: payload.contact?.phone,
          linkedin: linkedinForWrite,
          location: payload.contact?.location,
          email_verified: emailVerified,
          phone_verified: payload.contact?.phoneVerified || false,
          linkedin_verified: linkedInVerifiedForWrite({
            existingLinkedIn: existing?.linkedin,
            existingVerified: existing?.linkedin_verified,
            incomingLinkedIn: linkedinForWrite,
            incomingVerified: payload.contact?.linkedinVerified
          }),
          preferred_layout: payload.preferredLayout || "traditional",
          auth_user_id: user?.id || existing?.auth_user_id || null,
          updated_at: new Date().toISOString()
        });

        let { error: candidateError } = await rawSupabase
          .from("candidates")
          .upsert(candidateRowForWrite(emailForWrite, emailVerifiedForWrite), { onConflict: "handle" });

        if (
          candidateError &&
          existing?.handle &&
          !emailKept &&
          /candidates_email_key|email.*unique/i.test(candidateError.message || "")
        ) {
          emailForWrite = String(existing.email || "");
          emailVerifiedForWrite = Boolean(existing.email_verified);
          emailNotice = "This page kept its current email because the resume email is already used on another page.";
          emailKept = true;
          payload.email = emailForWrite;
          if (payload.contact && typeof payload.contact === "object") {
            payload.contact.email = emailForWrite;
            payload.contact.emailVerified = emailVerifiedForWrite;
          }
          const retry = await rawSupabase
            .from("candidates")
            .upsert(candidateRowForWrite(emailForWrite, emailVerifiedForWrite), { onConflict: "handle" });
          candidateError = retry.error;
        }

        if (candidateError) {
          console.error("Supabase candidate upsert error:", candidateError);
          if (/candidates_email_key|email.*unique/i.test(candidateError.message || "")) {
            const { data: byEmail } = incomingEmail
              ? await rawSupabase.from("candidates").select("handle").ilike("email", incomingEmail).maybeSingle()
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
          const { error: ownerError } = await rawSupabase
            .from("candidates")
            .update({ owner_token_hash: hashOwnerToken(tokenToSet) })
            .eq("handle", handle);
          if (ownerError && !missingOwnerColumn(ownerError.message)) {
            console.error("Could not store handle owner token:", ownerError.message);
          }
        }

        const linkedInSub = String(payload.linkedinSub || "").trim();
        if (linkedInSub) {
          const { error: subError } = await rawSupabase
            .from("candidates")
            .update({ linkedin_sub: linkedInSub })
            .eq("handle", handle);
          if (subError) {
            console.error("Could not store LinkedIn account id:", subError.message);
          }
        }

        const { data: candidateRow } = await rawSupabase.from("candidates").select("id").eq("handle", handle).maybeSingle();

        await rawSupabase.from("skills").delete().eq("candidate_handle", handle);
        if (payload.skills && payload.skills.length > 0) {
          await rawSupabase.from("skills").insert(payload.skills.map((skill: string) => ({ candidate_handle: handle, skill })));
        }

        await rawSupabase.from("education").delete().eq("candidate_handle", handle);
        if (payload.education && payload.education.length > 0) {
          await rawSupabase.from("education").insert(
            payload.education.map((edu: { id?: string; institution: string; degree: string; year?: string }) => ({
              id: edu.id || `edu-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              candidate_handle: handle,
              institution: edu.institution,
              degree: edu.degree,
              year: edu.year
            }))
          );
        }

        const assetRows = (Array.isArray(payload.portfolioAssets) ? payload.portfolioAssets : [])
          .map((asset: Partial<PortfolioAsset>) => normalizePortfolioAsset(asset))
          .filter(Boolean) as PortfolioAsset[];
        const { error: assetsDeleteError } = await rawSupabase.from("portfolio_assets").delete().eq("candidate_handle", handle);
        if (assetsDeleteError) {
          console.error("Could not clear portfolio assets:", assetsDeleteError.message);
        } else if (assetRows.length > 0) {
          const { error: assetsInsertError } = await rawSupabase.from("portfolio_assets").insert(
            assetRows.map((asset) => ({
              id: asset.id,
              candidate_handle: handle,
              title: asset.title,
              description: asset.description || "",
              url: asset.url || "",
              type: asset.type,
              issuer: asset.issuer || "",
              issued_at: asset.issuedAt || "",
              verification_status: asset.verificationStatus,
              verification_note: asset.verificationNote || ""
            }))
          );
          if (assetsInsertError) {
            console.error("Could not save portfolio assets:", assetsInsertError.message);
            return NextResponse.json(
              { error: `Sample work did not save: ${assetsInsertError.message}` },
              { status: 500 }
            );
          }
        }

        const incomingMilestones = Array.isArray(payload.milestones) ? payload.milestones : [];
        const incomingIds = incomingMilestones.map((m: { id?: string }) => m.id).filter(Boolean);
        const { data: existingMilestones } = await rawSupabase.from("milestones").select("id").eq("candidate_handle", handle);
        const staleIds = (existingMilestones || []).map((row) => row.id).filter((id) => !incomingIds.includes(id));
        if (staleIds.length > 0) {
          await rawSupabase.from("milestones").delete().in("id", staleIds);
        }

        for (const m of incomingMilestones) {
          const milestoneId = m.id || `m-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

          await rawSupabase.from("milestones").upsert({
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

          await rawSupabase.from("artifacts").delete().eq("milestone_id", milestoneId);
          if (m.artifacts && m.artifacts.length > 0) {
            await rawSupabase.from("artifacts").insert(
              m.artifacts.map((a: { id?: string; name: string; type: string }) => ({
                id: a.id || `art-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                milestone_id: milestoneId,
                name: a.name,
                type: a.type
              }))
            );
          }

          await rawSupabase.from("registry_links").delete().eq("milestone_id", milestoneId);
          if (m.registryLinks && m.registryLinks.length > 0) {
            await rawSupabase.from("registry_links").insert(
              m.registryLinks.map((l: { id?: string; type: string; url: string; label: string }) => ({
                id: l.id || `reg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                milestone_id: milestoneId,
                type: l.type,
                url: l.url,
                label: l.label
              }))
            );
          }

          if (Array.isArray(m.verifications)) {
            const { data: existingVers } = await rawSupabase.from("verifications").select("id").eq("milestone_id", milestoneId);
            const existingIds = new Set((existingVers || []).map((row) => row.id));
            const keepIds = new Set(
              m.verifications.map((v: { id?: string }) => v.id).filter((id: string | undefined): id is string => Boolean(id))
            );
            const staleIds = (existingVers || []).map((row) => row.id).filter((id) => !keepIds.has(id));
            if (staleIds.length > 0) {
              await rawSupabase.from("verifications").delete().in("id", staleIds);
            }
            const fresh = m.verifications.filter((v: { id?: string }) => v.id && !existingIds.has(v.id));
            if (fresh.length > 0) {
              await rawSupabase.from("verifications").insert(
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

        if (isNewClaim && incomingEmail && !user) {
          const issued = await issueRestoreCode(rawSupabase, handle, incomingEmail);
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
    const discardedDraft = await clearPublishedDraft(authUserId, handle, publishedDraftRevision);
    const draftCleared = discardedDraft.cleared;

    const response = NextResponse.json({
      success: true,
      handle,
      restoreEmailed,
      draftCleared,
      draftRevision: discardedDraft.revision,
      emailKept,
      emailNotice,
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

async function clearPublishedDraft(authUserId: string | null, handle: string, cancelRevision: number | null) {
  clearFileDraftsAfterPublish({ authUserId, handle });
  if (!authUserId || !process.env.SUPABASE_SERVICE_ROLE_KEY) return { cleared: true, revision: cancelRevision || 0 };
  const admin = getSupabaseAdmin();
  if (!admin) return { cleared: true, revision: cancelRevision || 0 };
  const current = await admin
    .from("dossier_drafts")
    .select("revision")
    .eq("auth_user_id", authUserId)
    .maybeSingle();
  if (current.error) {
    if (draftDeleteIsMissingTable(current.error.message, current.error.code)) {
      return { cleared: true, revision: cancelRevision || 0 };
    }
    console.error("Could not discard dossier draft after publish:", current.error.message);
    return { cleared: false, revision: cancelRevision || 0 };
  }
  const decision = decideDraftCancel({
    hasRow: Boolean(current.data),
    storedRevision: Number(current.data?.revision) || 0,
    cancelRevision
  });
  if (!current.data && decision.revision < 1) return { cleared: true, revision: 0 };
  const tombstone = {
    auth_user_id: authUserId,
    handle,
    payload: discardedDraftPayload(),
    revision: decision.revision,
    updated_at: new Date().toISOString()
  };
  const write = current.data
    ? await admin
        .from("dossier_drafts")
        .update({
          payload: tombstone.payload,
          revision: tombstone.revision,
          updated_at: tombstone.updated_at
        })
        .eq("auth_user_id", authUserId)
        .lte("revision", decision.revision)
    : await admin.from("dossier_drafts").insert(tombstone);
  if (!write.error || draftDeleteIsMissingTable(write.error.message, write.error.code)) {
    return { cleared: true, revision: decision.revision };
  }
  console.error("Could not discard dossier draft after publish:", write.error.message);
  return { cleared: false, revision: decision.revision };
}
