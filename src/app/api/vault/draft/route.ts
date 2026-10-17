import { NextRequest, NextResponse } from "next/server";
import { BETA_COOKIE, isBetaEnforced } from "@/lib/betaAccess";
import { decideDraftHandle, sanitizeDraftPayload } from "@/lib/dossierDraft";
import { findCandidateForUser, requireDraftAccess } from "@/lib/vaultSession";
import { markPrivateNoStore } from "@/lib/httpCache";

function json(body: unknown, init?: { status?: number }) {
  return markPrivateNoStore(NextResponse.json(body, init));
}

export const dynamic = "force-dynamic";

function betaBlocked(req: NextRequest) {
  return isBetaEnforced() && req.cookies.get(BETA_COOKIE)?.value !== "ok";
}

export async function GET() {
  const access = await requireDraftAccess();
  if (!access.ok) return access.response;

  const { data, error } = await access.admin
    .from("dossier_drafts")
    .select("handle, payload, updated_at")
    .eq("auth_user_id", access.user.id)
    .maybeSingle();

  if (error) {
    return json({ error: error.message || "Could not load the draft." }, { status: 500 });
  }
  if (!data?.payload || typeof data.payload !== "object") {
    return json({ error: "No draft yet." }, { status: 404 });
  }

  return json({
    payload: data.payload,
    updatedAt: data.updated_at,
    handle: String(data.handle || "")
  });
}

export async function PUT(req: NextRequest) {
  if (betaBlocked(req)) {
    return json({ error: "Private beta. Studio access is required." }, { status: 401 });
  }

  const access = await requireDraftAccess();
  if (!access.ok) return access.response;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return json({ error: "Draft payload must be an object." }, { status: 400 });
  }
  const record = body as { handle?: unknown; payload?: unknown };
  const sanitized = sanitizeDraftPayload(record.payload);
  if (!sanitized.ok) return json({ error: sanitized.error }, { status: 400 });

  const found = await findCandidateForUser(access.admin, access.user);
  if ("error" in found) return json({ error: found.error }, { status: 500 });
  if ("conflict" in found) {
    return json({ error: "This account does not own that page." }, { status: 403 });
  }

  const requested = String(record.handle || sanitized.payload.handle || "").toLowerCase().trim();
  let taken = false;
  if (requested) {
    const existing = await access.admin
      .from("candidates")
      .select("handle, auth_user_id, email")
      .eq("handle", requested)
      .maybeSingle();
    if (existing.error) return json({ error: existing.error.message }, { status: 500 });
    if (existing.data?.handle) {
      const sameUser = existing.data.auth_user_id === access.user.id;
      const sameEmail = Boolean(
        access.user.email &&
          String(existing.data.email || "").toLowerCase() === access.user.email.toLowerCase()
      );
      taken = !sameUser && !sameEmail;
    }
  }

  const decision = decideDraftHandle({
    requestedHandle: requested,
    ownerHandle: found.candidate?.handle || "",
    requestedHandleTakenBySomeoneElse: taken
  });
  if (!decision.ok) return json({ error: decision.error }, { status: decision.status });

  const updatedAt = new Date().toISOString();
  const { error } = await access.admin.from("dossier_drafts").upsert(
    {
      auth_user_id: access.user.id,
      handle: decision.handle,
      payload: sanitized.payload,
      updated_at: updatedAt
    },
    { onConflict: "auth_user_id" }
  );
  if (error) return json({ error: error.message || "Could not save the draft." }, { status: 500 });

  return json({ success: true, handle: decision.handle, updatedAt });
}

export async function DELETE(req: NextRequest) {
  if (betaBlocked(req)) {
    return json({ error: "Private beta. Studio access is required." }, { status: 401 });
  }

  const access = await requireDraftAccess();
  if (!access.ok) return access.response;

  const { error } = await access.admin.from("dossier_drafts").delete().eq("auth_user_id", access.user.id);
  if (error) return json({ error: error.message || "Could not discard the draft." }, { status: 500 });

  return json({ success: true });
}
