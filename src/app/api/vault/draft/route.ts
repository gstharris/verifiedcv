import { NextRequest, NextResponse } from "next/server";
import { BETA_COOKIE, isBetaEnforced } from "@/lib/betaAccess";
import {
  decideDraftCancel,
  decideDraftHandle,
  decideDraftSave,
  discardedDraftPayload,
  draftHasResume,
  isDiscardedDraft,
  parseDraftRevision,
  sanitizeDraftPayload
} from "@/lib/dossierDraft";
import { findCandidateForUser, requireDraftAccess } from "@/lib/vaultSession";
import { markPrivateNoStore } from "@/lib/httpCache";
import type { SupabaseClient } from "@supabase/supabase-js";

function json(body: unknown, init?: { status?: number }) {
  return markPrivateNoStore(NextResponse.json(body, init));
}

export const dynamic = "force-dynamic";

function betaBlocked(req: NextRequest) {
  return isBetaEnforced() && req.cookies.get(BETA_COOKIE)?.value !== "ok";
}

type DraftRow = {
  handle: string | null;
  payload: unknown;
  updated_at: string;
  revision: number | null;
};

async function readDraftRow(admin: SupabaseClient, userId: string) {
  return admin
    .from("dossier_drafts")
    .select("handle, payload, updated_at, revision")
    .eq("auth_user_id", userId)
    .maybeSingle<DraftRow>();
}

export async function GET() {
  const access = await requireDraftAccess();
  if (!access.ok) return access.response;

  const { data, error } = await readDraftRow(access.admin, access.user.id);

  if (error) {
    return json({ error: error.message || "Could not load the draft." }, { status: 500 });
  }
  const revision = Number(data?.revision) || 0;
  if (!data?.payload || typeof data.payload !== "object" || isDiscardedDraft(data.payload) || !draftHasResume(data.payload)) {
    return json({ error: "No draft yet.", revision }, { status: 404 });
  }

  return json({
    payload: data.payload,
    updatedAt: data.updated_at,
    handle: String(data.handle || ""),
    revision
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
  const record = body as { handle?: unknown; payload?: unknown; revision?: unknown };
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

  const current = await readDraftRow(access.admin, access.user.id);
  if (current.error) return json({ error: current.error.message }, { status: 500 });
  const storedRevision = Number(current.data?.revision) || 0;
  const save = decideDraftSave({
    hasRow: Boolean(current.data),
    storedRevision,
    discarded: isDiscardedDraft(current.data?.payload),
    writeRevision: parseDraftRevision(record.revision)
  });
  if (!save.ok) return json({ error: "Those edits were already cancelled.", revision: save.revision }, { status: 409 });
  if (found.candidate?.handle && !draftHasResume(sanitized.payload)) {
    return json({ error: "Those edits were already cancelled.", revision: storedRevision }, { status: 409 });
  }

  const updatedAt = new Date().toISOString();
  const row = {
    auth_user_id: access.user.id,
    handle: decision.handle,
    payload: sanitized.payload,
    revision: save.revision,
    updated_at: updatedAt
  };

  if (!current.data) {
    const inserted = await access.admin.from("dossier_drafts").insert(row).select("revision");
    if (inserted.error?.code === "23505") {
      const latest = await readDraftRow(access.admin, access.user.id);
      return json(
        { error: "Those edits were already cancelled.", revision: Number(latest.data?.revision) || save.revision },
        { status: 409 }
      );
    }
    if (inserted.error) return json({ error: inserted.error.message || "Could not save the draft." }, { status: 500 });
    return json({ success: true, handle: decision.handle, updatedAt, revision: save.revision });
  }

  const updated = await access.admin
    .from("dossier_drafts")
    .update({
      handle: row.handle,
      payload: row.payload,
      revision: row.revision,
      updated_at: row.updated_at
    })
    .eq("auth_user_id", access.user.id)
    .lt("revision", save.revision)
    .select("revision");
  if (updated.error) return json({ error: updated.error.message || "Could not save the draft." }, { status: 500 });
  if (!updated.data?.length) {
    const latest = await readDraftRow(access.admin, access.user.id);
    return json(
      { error: "Those edits were already cancelled.", revision: Number(latest.data?.revision) || storedRevision },
      { status: 409 }
    );
  }

  return json({ success: true, handle: decision.handle, updatedAt, revision: save.revision });
}

export async function DELETE(req: NextRequest) {
  if (betaBlocked(req)) {
    return json({ error: "Private beta. Studio access is required." }, { status: 401 });
  }

  const access = await requireDraftAccess();
  if (!access.ok) return access.response;

  const body = await req.json().catch(() => null);
  const cancelRevision = parseDraftRevision(
    body && typeof body === "object" && !Array.isArray(body) ? (body as { revision?: unknown }).revision : null
  );
  const current = await readDraftRow(access.admin, access.user.id);
  if (current.error) return json({ error: current.error.message || "Could not discard the draft." }, { status: 500 });

  const decision = decideDraftCancel({
    hasRow: Boolean(current.data),
    storedRevision: Number(current.data?.revision) || 0,
    cancelRevision
  });
  const updatedAt = new Date().toISOString();
  const tombstone = {
    auth_user_id: access.user.id,
    handle: String(current.data?.handle || ""),
    payload: discardedDraftPayload(),
    revision: decision.revision,
    updated_at: updatedAt
  };

  if (!current.data) {
    if (decision.revision < 1) return json({ success: true, revision: 0 });
    const inserted = await access.admin.from("dossier_drafts").insert(tombstone);
    if (inserted.error?.code === "23505") {
      const raced = await access.admin
        .from("dossier_drafts")
        .update({
          payload: tombstone.payload,
          revision: tombstone.revision,
          updated_at: tombstone.updated_at
        })
        .eq("auth_user_id", access.user.id)
        .lte("revision", decision.revision);
      if (raced.error) return json({ error: raced.error.message || "Could not discard the draft." }, { status: 500 });
    } else if (inserted.error) {
      return json({ error: inserted.error.message || "Could not discard the draft." }, { status: 500 });
    }
    return json({ success: true, revision: decision.revision });
  }

  const discard = async (revision: number) =>
    access.admin
      .from("dossier_drafts")
      .update({
        payload: tombstone.payload,
        revision,
        updated_at: tombstone.updated_at
      })
      .eq("auth_user_id", access.user.id)
      .lte("revision", revision)
      .select("revision");

  let fence = decision.revision;
  let discarded = await discard(fence);
  if (discarded.error) return json({ error: discarded.error.message || "Could not discard the draft." }, { status: 500 });
  if (!discarded.data?.length) {
    const latest = await readDraftRow(access.admin, access.user.id);
    if (latest.error) return json({ error: latest.error.message || "Could not discard the draft." }, { status: 500 });
    fence = Math.max(fence, Number(latest.data?.revision) || 0);
    discarded = await discard(fence);
    if (discarded.error) return json({ error: discarded.error.message || "Could not discard the draft." }, { status: 500 });
  }

  return json({ success: true, revision: fence });
}
