import { NextRequest, NextResponse } from "next/server";
import { BETA_COOKIE, isBetaEnforced } from "@/lib/betaAccess";
import {
  applyIdentityPatch,
  applyIdentityToDraft,
  parseIdentityPatch,
  type CandidateIdentity
} from "@/lib/dossierDraft";
import { findCandidateForUser, requireDraftAccess, type OwnedCandidate } from "@/lib/vaultSession";

export const dynamic = "force-dynamic";

function identityFromCandidate(row: OwnedCandidate): CandidateIdentity {
  return {
    email: String(row.email || ""),
    phone: String(row.phone || ""),
    linkedin: String(row.linkedin || ""),
    emailVerified: Boolean(row.email_verified),
    phoneVerified: Boolean(row.phone_verified),
    linkedinVerified: Boolean(row.linkedin_verified),
    linkedinSub: String(row.linkedin_sub || "")
  };
}

export async function PATCH(req: NextRequest) {
  if (isBetaEnforced() && req.cookies.get(BETA_COOKIE)?.value !== "ok") {
    return NextResponse.json({ error: "Private beta. Studio access is required." }, { status: 401 });
  }

  const access = await requireDraftAccess();
  if (!access.ok) return access.response;

  const rawBody = await req.json().catch(() => null);
  const parsed = parseIdentityPatch(rawBody);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const found = await findCandidateForUser(access.admin, access.user);
  if ("error" in found) return NextResponse.json({ error: found.error }, { status: 500 });
  if ("conflict" in found) {
    return NextResponse.json({ error: "This account does not own that page." }, { status: 403 });
  }
  if (!found.candidate?.handle) {
    return NextResponse.json({ error: "No portfolio yet." }, { status: 404 });
  }

  const body = parsed.patch;
  const handle = String(rawBody && typeof rawBody === "object" && "handle" in rawBody ? (rawBody as { handle?: unknown }).handle : "")
    .toLowerCase()
    .trim();
  if (handle && handle !== found.candidate.handle) {
    return NextResponse.json(
      { error: `This account already has a page at verifiedcv.app/${found.candidate.handle}.` },
      { status: 409 }
    );
  }

  const current = identityFromCandidate(found.candidate);
  const applied = applyIdentityPatch(current, body);
  const { error } = await access.admin.from("candidates").update(applied.columns).eq("handle", found.candidate.handle);
  if (error) {
    if (/candidates_email_key|email.*unique/i.test(error.message || "")) {
      return NextResponse.json({ error: "That email is already used on another page.", code: "EMAIL_TAKEN" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message || "Could not update identity." }, { status: 500 });
  }

  let draftUpdated = false;
  const draft = await access.admin
    .from("dossier_drafts")
    .select("payload")
    .eq("auth_user_id", access.user.id)
    .maybeSingle();
  if (!draft.error && draft.data?.payload && typeof draft.data.payload === "object" && !Array.isArray(draft.data.payload)) {
    const payload = applyIdentityToDraft(draft.data.payload as Record<string, unknown>, current, body);
    const saved = await access.admin
      .from("dossier_drafts")
      .update({ payload, updated_at: new Date().toISOString() })
      .eq("auth_user_id", access.user.id);
    draftUpdated = !saved.error;
    if (saved.error) console.error("Could not update the open draft after identity confirmation:", saved.error.message);
  }

  return NextResponse.json({
    success: true,
    draftUpdated,
    contact: {
      email: applied.next.email,
      phone: applied.next.phone,
      linkedin: applied.next.linkedin,
      emailVerified: applied.next.emailVerified,
      phoneVerified: applied.next.phoneVerified,
      linkedinVerified: applied.next.linkedinVerified
    }
  });
}
