import { contactIdentity } from "./dossierChanges";
import { linkedInProfileUrl } from "./linkedin";
import { hasPortfolioContent } from "./studioPortfolio";

export const DOSSIER_DRAFTS_KEY = "__dossier_drafts";
export const EXPLICIT_PUBLISH_HEADER = "x-vcv-publish";

export function isExplicitPublish(value: string | null | undefined) {
  return value === "1";
}

export function requestPublishesLive(header: string | null | undefined, body: unknown) {
  if (isExplicitPublish(header)) return true;
  if (!body || typeof body !== "object") return false;
  return (body as { explicitPublish?: unknown }).explicitPublish === true;
}

/** A local-only draft has nothing on the server to delete. Those responses must not block cancel. */
export function draftDeleteBlocksCancel(status: number, serverDraftKnown: boolean) {
  if (status >= 200 && status < 300) return false;
  if (!serverDraftKnown && (status === 401 || status === 404 || status === 503)) return false;
  return true;
}

export function discardedDraftPayload() {
  return { __vcvDraft: "discarded" };
}

export function isDiscardedDraft(payload: unknown) {
  return Boolean(
    payload &&
      typeof payload === "object" &&
      !Array.isArray(payload) &&
      (payload as { __vcvDraft?: unknown }).__vcvDraft === "discarded"
  );
}

/** Client write numbers start at 1. Missing or fractional values are not a fence. */
export function parseDraftRevision(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > Number.MAX_SAFE_INTEGER) {
    return null;
  }
  return value;
}

/**
 * A save may land after cancel already discarded the row.
 * Reject it when its number is not newer than the stored fence.
 * A save that omits a number is still rejected once the row is a tombstone.
 */
export function decideDraftSave(input: {
  hasRow: boolean;
  storedRevision: number;
  discarded: boolean;
  writeRevision: number | null;
}): { ok: true; revision: number } | { ok: false; revision: number } {
  const stored = input.storedRevision > 0 ? input.storedRevision : 0;
  if (input.writeRevision == null) {
    if (input.hasRow && input.discarded) return { ok: false, revision: stored };
    return { ok: true, revision: stored + 1 };
  }
  if (input.hasRow && input.writeRevision <= stored) return { ok: false, revision: stored };
  return { ok: true, revision: input.writeRevision };
}

/**
 * Cancel moves the fence to the newest save the browser has already issued.
 * A draft that was stored before fences existed still gets a fence of 1,
 * so a later save cannot recreate it.
 */
export function decideDraftCancel(input: {
  hasRow: boolean;
  storedRevision: number;
  cancelRevision: number | null;
}) {
  const stored = input.storedRevision > 0 ? input.storedRevision : 0;
  const cancelAt = input.cancelRevision && input.cancelRevision > 0 ? input.cancelRevision : 0;
  let revision = Math.max(stored, cancelAt);
  if ((input.hasRow || cancelAt > 0) && revision < 1) revision = 1;
  return { revision };
}

/** A name and contact line with no chapters, summary, highlights, or sample work is not an open résumé edit. */
export function draftHasResume(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return false;
  return hasPortfolioContent(payload as Parameters<typeof hasPortfolioContent>[0]);
}

export function readDraftResponse(status: number, body: unknown) {
  const record = body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : {};
  const revision = parseDraftRevision(record.revision) ?? 0;
  const payload = record.payload;
  if (
    status >= 200 &&
    status < 300 &&
    payload &&
    typeof payload === "object" &&
    !Array.isArray(payload) &&
    !isDiscardedDraft(payload) &&
    draftHasResume(payload)
  ) {
    return {
      state: "draft" as const,
      payload: payload as Record<string, unknown>,
      handle: String(record.handle || ""),
      revision
    };
  }
  return { state: "empty" as const, revision };
}

/**
 * After cancel, the browser can still hold the discarded résumé.
 * Upload that copy again only when the server has no newer fence.
 */
export function shouldRestoreLocalDraft(input: {
  serverHasDraft: boolean;
  serverRevision: number;
  localRevision: number;
  localHasContent: boolean;
  localDiffersFromLive: boolean;
}) {
  if (input.serverHasDraft || !input.localHasContent || !input.localDiffersFromLive) return false;
  if (input.serverRevision > 0 && input.localRevision <= input.serverRevision) return false;
  return true;
}
export const MAX_DRAFT_PAYLOAD_CHARS = 1_000_000;

export const PUBLIC_CANDIDATE_COLUMNS =
  "handle, full_name, headline, summary_statement, bio_summary, email, phone, linkedin, location, email_verified, phone_verified, linkedin_verified, preferred_layout";

const RESERVED_HANDLES = new Set([
  "api",
  "studio",
  "admin",
  "vault",
  "login",
  "signup",
  "auth",
  "verified",
  "help",
  "pricing",
  "settings",
  "attest",
  "mock-linkedin",
  DOSSIER_DRAFTS_KEY
]);

const IDENTITY_COLUMNS = [
  "email",
  "phone",
  "linkedin",
  "email_verified",
  "phone_verified",
  "linkedin_verified",
  "linkedin_sub"
] as const;

export type IdentityColumn = (typeof IDENTITY_COLUMNS)[number];

export type StoredDraft = {
  handle: string;
  payload: Record<string, unknown>;
  updatedAt: string;
};

export type IdentityPatch = {
  email?: string;
  phone?: string;
  linkedin?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  linkedinVerified?: boolean;
  linkedinSub?: string;
};

export type CandidateIdentity = {
  email: string;
  phone: string;
  linkedin: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  linkedinVerified: boolean;
  linkedinSub: string;
};

function withoutDraftFields<T extends Record<string, unknown>>(record: T) {
  const rest = { ...record };
  delete rest.draft;
  delete rest.draftPayload;
  delete rest.dossierDraft;
  delete rest.explicitPublish;
  delete rest.draftRevision;
  delete rest.__vcvDraft;
  delete rest.__vcvRevision;
  return rest;
}

export function dossierRecordForFile<T extends Record<string, unknown>>(record: T) {
  return withoutDraftFields(record);
}

export function publicVaultRecord<T extends Record<string, unknown>>(record: T) {
  const rest = withoutDraftFields(record);
  delete rest.ownerTokenHash;
  delete rest.owner_token_hash;
  return rest;
}

export function isReservedDraftHandle(handle: string) {
  return handle === DOSSIER_DRAFTS_KEY || RESERVED_HANDLES.has(handle);
}

export function readDraftMap(store: Record<string, unknown>): Record<string, StoredDraft> {
  const raw = store[DOSSIER_DRAFTS_KEY];
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return { ...(raw as Record<string, StoredDraft>) };
}

export function writeStoredDraft(store: Record<string, unknown>, authUserId: string, draft: StoredDraft) {
  const next = { ...store };
  const drafts = readDraftMap(store);
  drafts[authUserId] = draft;
  next[DOSSIER_DRAFTS_KEY] = drafts;
  return next;
}

export function deleteStoredDraft(store: Record<string, unknown>, authUserId: string) {
  const next = { ...store };
  const drafts = readDraftMap(store);
  delete drafts[authUserId];
  if (Object.keys(drafts).length) next[DOSSIER_DRAFTS_KEY] = drafts;
  else delete next[DOSSIER_DRAFTS_KEY];
  return next;
}

export function deleteDraftsForPublish(
  store: Record<string, unknown>,
  opts: { authUserId?: string | null; handle?: string | null }
) {
  const handle = String(opts.handle || "").toLowerCase().trim();
  const next = { ...store };
  const drafts = readDraftMap(store);
  for (const [userId, draft] of Object.entries(drafts)) {
    const draftHandle = String(draft?.handle || "").toLowerCase().trim();
    const sameUser = Boolean(opts.authUserId) && userId === opts.authUserId;
    const unscopedHandle = !opts.authUserId && Boolean(handle) && draftHandle === handle;
    if (sameUser || unscopedHandle) delete drafts[userId];
  }
  if (Object.keys(drafts).length) next[DOSSIER_DRAFTS_KEY] = drafts;
  else delete next[DOSSIER_DRAFTS_KEY];
  return next;
}

export function sanitizeDraftPayload(
  value: unknown
): { ok: true; payload: Record<string, unknown> } | { ok: false; error: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, error: "Draft payload must be an object." };
  }
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
  } catch {
    return { ok: false, error: "Draft payload could not be saved." };
  }
  delete payload.ownerTokenHash;
  delete payload.owner_token_hash;
  delete payload.__vcvDraft;
  delete payload.__vcvRevision;
  delete payload.draftRevision;
  if (JSON.stringify(payload).length > MAX_DRAFT_PAYLOAD_CHARS) {
    return { ok: false, error: "Draft is too large to save." };
  }
  return { ok: true, payload };
}

export function decideDraftHandle(input: {
  requestedHandle?: string | null;
  ownerHandle?: string | null;
  requestedHandleTakenBySomeoneElse?: boolean;
}): { ok: true; handle: string } | { ok: false; status: number; error: string } {
  const requested = String(input.requestedHandle || "").toLowerCase().trim();
  const ownerHandle = String(input.ownerHandle || "").toLowerCase().trim();
  if (requested && !/^[a-z0-9_-]{2,64}$/.test(requested)) {
    return { ok: false, status: 400, error: "Handle can use letters, numbers, hyphens, and underscores." };
  }
  if (requested && isReservedDraftHandle(requested)) {
    return { ok: false, status: 400, error: "That handle is reserved." };
  }
  if (ownerHandle && requested && requested !== ownerHandle) {
    return {
      ok: false,
      status: 409,
      error: `This account already has a page at verifiedcv.app/${ownerHandle}.`
    };
  }
  if (input.requestedHandleTakenBySomeoneElse) {
    return { ok: false, status: 403, error: "This handle is owned by another account." };
  }
  return { ok: true, handle: requested || ownerHandle };
}

export function parseIdentityPatch(
  body: unknown
): { ok: true; patch: IdentityPatch } | { ok: false; error: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "Identity update must be an object." };
  }
  const record = body as Record<string, unknown>;
  const patch: IdentityPatch = {};
  if ("email" in record) {
    if (typeof record.email !== "string") return { ok: false, error: "Email must be a string." };
    const email = record.email.trim().toLowerCase();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { ok: false, error: "Enter a valid email address." };
    }
    patch.email = email;
  }
  if ("phone" in record) {
    if (typeof record.phone !== "string") return { ok: false, error: "Phone must be a string." };
    patch.phone = record.phone.trim();
  }
  if ("linkedin" in record) {
    if (typeof record.linkedin !== "string") return { ok: false, error: "LinkedIn must be a string." };
    const trimmed = record.linkedin.trim();
    patch.linkedin = linkedInProfileUrl(trimmed) || trimmed;
  }
  if ("emailVerified" in record) {
    if (typeof record.emailVerified !== "boolean") return { ok: false, error: "emailVerified must be true or false." };
    patch.emailVerified = record.emailVerified;
  }
  if ("phoneVerified" in record) {
    if (typeof record.phoneVerified !== "boolean") return { ok: false, error: "phoneVerified must be true or false." };
    patch.phoneVerified = record.phoneVerified;
  }
  if ("linkedinVerified" in record) {
    if (typeof record.linkedinVerified !== "boolean") return { ok: false, error: "linkedinVerified must be true or false." };
    patch.linkedinVerified = record.linkedinVerified;
  }
  if ("linkedinSub" in record) {
    if (typeof record.linkedinSub !== "string" || !record.linkedinSub.trim()) {
      return { ok: false, error: "linkedinSub must be a string." };
    }
    patch.linkedinSub = record.linkedinSub.trim();
  }
  if (!Object.keys(patch).length) return { ok: false, error: "Nothing to update." };
  return { ok: true, patch };
}

export function applyIdentityPatch(current: CandidateIdentity, patch: IdentityPatch) {
  const next: CandidateIdentity = { ...current };
  const columns: Partial<Record<IdentityColumn, string | boolean>> = {};
  const live = contactIdentity({
    email: current.email,
    phone: current.phone,
    linkedin: current.linkedin
  });
  const incoming = contactIdentity({
    email: patch.email ?? current.email,
    phone: patch.phone ?? current.phone,
    linkedin: patch.linkedin ?? current.linkedin
  });

  if (patch.email !== undefined) {
    next.email = patch.email;
    columns.email = patch.email;
  }
  if (patch.emailVerified !== undefined) {
    next.emailVerified = patch.emailVerified;
    columns.email_verified = patch.emailVerified;
  } else if (patch.email !== undefined && incoming.email !== live.email) {
    next.emailVerified = false;
    columns.email_verified = false;
  }

  if (patch.phone !== undefined) {
    next.phone = patch.phone;
    columns.phone = patch.phone;
  }
  if (patch.phoneVerified !== undefined) {
    next.phoneVerified = patch.phoneVerified;
    columns.phone_verified = patch.phoneVerified;
  } else if (patch.phone !== undefined && incoming.phone !== live.phone) {
    next.phoneVerified = false;
    columns.phone_verified = false;
  }

  if (patch.linkedin !== undefined) {
    const kept = linkedInProfileUrl(current.linkedin);
    const incomingUrl = linkedInProfileUrl(patch.linkedin);
    if (incomingUrl || !kept) {
      next.linkedin = incomingUrl || patch.linkedin.trim();
      columns.linkedin = next.linkedin;
    }
  }
  if (patch.linkedinVerified !== undefined) {
    next.linkedinVerified = patch.linkedinVerified;
    columns.linkedin_verified = patch.linkedinVerified;
  } else if (patch.linkedin !== undefined && incoming.linkedin !== live.linkedin && columns.linkedin !== undefined) {
    next.linkedinVerified = false;
    columns.linkedin_verified = false;
  }
  if (!linkedInProfileUrl(next.linkedin)) {
    next.linkedinVerified = false;
    columns.linkedin_verified = false;
  }

  if (patch.linkedinSub !== undefined) {
    next.linkedinSub = patch.linkedinSub;
    columns.linkedin_sub = patch.linkedinSub;
  }

  return { next, columns };
}

export function applyIdentityToDraft(
  payload: Record<string, unknown>,
  current: CandidateIdentity,
  patch: IdentityPatch
) {
  const { next, columns } = applyIdentityPatch(current, patch);
  const copy = structuredClone(payload);
  const contact =
    copy.contact && typeof copy.contact === "object" && !Array.isArray(copy.contact)
      ? { ...(copy.contact as Record<string, unknown>) }
      : {};
  if ("email" in columns) {
    contact.email = next.email;
    copy.email = next.email;
  }
  if ("email_verified" in columns) contact.emailVerified = next.emailVerified;
  if ("phone" in columns) contact.phone = next.phone;
  if ("phone_verified" in columns) contact.phoneVerified = next.phoneVerified;
  if ("linkedin" in columns) contact.linkedin = next.linkedin;
  if ("linkedin_verified" in columns) contact.linkedinVerified = next.linkedinVerified;
  if ("linkedin_sub" in columns) copy.linkedinSub = next.linkedinSub;
  copy.contact = contact;
  return copy;
}

export function draftDeleteIsMissingTable(message?: string, code?: string) {
  const text = `${code || ""} ${message || ""}`.toLowerCase();
  return (
    text.includes("dossier_drafts") &&
    (text.includes("does not exist") || text.includes("schema cache") || text.includes("42p01") || text.includes("pgrst205"))
  );
}

export function identityColumnsAreNarrow(columns: Record<string, unknown>) {
  return Object.keys(columns).every((key) => (IDENTITY_COLUMNS as readonly string[]).includes(key));
}
