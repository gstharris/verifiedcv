export const RESET_CONFIRMATION = "RESET";
export const PORTFOLIO_BUCKET = "portfolio-assets";
export const JWT_EXPIRY_CAVEAT =
  "Deleting a login does not instantly kill an access token a browser already has. That token can keep working until it expires, usually within an hour. Resetting the account you are signed in with signs this browser out and returns you to the home page. Other devices keep that token until it expires.";

const APP_SESSION_COOKIES = ["vcv_handle_owner", "vcv_linkedin_session", "vcv_linkedin_oauth_state"];

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const EXPLICIT_DELETE_ORDER = [
  "claim_artifacts",
  "claim_proof_documents",
  "claim_domain_verifications",
  "owner_codes",
  "email_codes",
  "dossier_drafts",
  "profiles",
  "candidates"
] as const;

export const CANDIDATE_CASCADE_TABLES = [
  "milestones",
  "artifacts",
  "registry_links",
  "verifications",
  "education",
  "skills",
  "portfolio_assets",
  "attestations",
  "experiences",
  "resumes",
  "impact_claims",
  "peer_attestations"
] as const;

export const PROFILE_CASCADE_TABLES = [
  "claims",
  "claim_audits",
  "claim_attestations",
  "profile_views",
  "trust_artifacts",
  "audit_context"
] as const;

export type AdminResetAccess =
  | { ok: true }
  | { ok: false; status: 401 | 403; error: string };

export type AdminResetRequest = {
  userId: string | null;
  email: string | null;
  dryRun: boolean;
  confirm: string;
  deleteAuthUser: boolean;
};

export type CandidateMatch = {
  id: string;
  handle: string;
  email: string | null;
  authUserId: string | null;
};

export type ResetSnapshot = {
  authUser: { id: string; email: string | null } | null;
  candidates: CandidateMatch[];
  skippedCandidates: { handle: string; reason: string }[];
  profiles: { id: string; handle: string | null }[];
  counts: Record<string, number>;
  storageObjects: { bucket: string; path: string }[];
};

export type DeleteStep = {
  table: (typeof EXPLICIT_DELETE_ORDER)[number];
  column: string;
  values: string[];
};

export type ResetSummary = {
  dryRun: boolean;
  target: { userId: string | null; email: string | null; handles: string[] };
  storageObjects: string[];
  tables: Record<string, number>;
  skippedCandidates: { handle: string; reason: string }[];
  sessionsRevoked: boolean;
  authUserDeleted: boolean;
  deleteAuthUser: boolean;
  signOutRequired: boolean;
  warnings: string[];
};

export type ResetDatabase = {
  load(target: { userId: string | null; email: string | null }): Promise<ResetSnapshot>;
  removeStorage(objects: { bucket: string; path: string }[]): Promise<number>;
  deleteRows(table: string, column: string, values: string[]): Promise<number>;
  revokeSessions(userId: string): Promise<"revoked" | "unsupported">;
  deleteAuthUser(userId: string): Promise<void>;
  clearLocalCopy(authUserId: string | null, handles: string[]): void;
};

export class ResetBlockedError extends Error {
  readonly table: string;

  constructor(table: string, detail: string) {
    super(detail);
    this.name = "ResetBlockedError";
    this.table = table;
  }
}

export function adminResetAllowlist(raw: string | undefined) {
  return (raw || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function authorizeAdminReset(input: {
  callerEmail: string | null | undefined;
  nodeEnv: string | undefined;
  allowlist: string[];
}): AdminResetAccess {
  const email = String(input.callerEmail || "").trim().toLowerCase();
  if (!email) {
    return { ok: false, status: 401, error: "Sign in first." };
  }
  if (input.allowlist.includes(email)) return { ok: true };
  if (input.nodeEnv === "development") return { ok: true };
  return {
    ok: false,
    status: 403,
    error: "Admin reset is limited to development, or to an email in ADMIN_RESET_EMAILS."
  };
}

export function parseAdminResetRequest(body: unknown): { ok: true; request: AdminResetRequest } | { ok: false; error: string } {
  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const userId = String(record.userId || "").trim();
  const email = String(record.email || "").trim().toLowerCase();
  if (userId && email) return { ok: false, error: "Enter an email or a user id, not both." };
  if (!userId && !email) return { ok: false, error: "Enter an email or a user id." };
  if (userId && !UUID_PATTERN.test(userId)) return { ok: false, error: "User id must be a UUID." };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Enter a valid email." };

  return {
    ok: true,
    request: {
      userId: userId || null,
      email: email || null,
      dryRun: record.dryRun !== false,
      confirm: typeof record.confirm === "string" ? record.confirm : "",
      deleteAuthUser: record.deleteAuthUser === true
    }
  };
}

export function storagePathFromUrl(url: string, bucket = PORTFOLIO_BUCKET) {
  const marker = `/${bucket}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  let path = url.slice(index + marker.length).split("?")[0].split("#")[0];
  try {
    path = decodeURIComponent(path);
  } catch {
    return null;
  }
  if (!path || path.includes("..") || path.startsWith("/")) return null;
  return path;
}

export function ownedStoragePath(
  url: string,
  owners: { handles: string[]; userId: string | null }
) {
  const path = storagePathFromUrl(url);
  if (!path) return null;
  const handles = owners.handles.map((handle) => handle.toLowerCase());
  const folder = path.split("/")[0]?.toLowerCase();
  if (handles.includes(folder)) return path;
  if (owners.userId && folder === owners.userId.toLowerCase()) return path;
  return null;
}

export function selectOwnedCandidates(
  rows: CandidateMatch[],
  authUser: { id: string; email: string | null } | null
) {
  const owned: CandidateMatch[] = [];
  const skipped: { handle: string; reason: string }[] = [];
  for (const row of rows) {
    if (authUser && row.authUserId && row.authUserId !== authUser.id) {
      skipped.push({
        handle: row.handle,
        reason: "This dossier is linked to a different login, so it was left in place."
      });
      continue;
    }
    owned.push(row);
  }
  return { owned, skipped };
}

export function buildDeleteSteps(snapshot: ResetSnapshot): DeleteStep[] {
  const handles = unique(snapshot.candidates.map((row) => row.handle.toLowerCase()));
  const emails = unique(
    [snapshot.authUser?.email, ...snapshot.candidates.map((row) => row.email)]
      .map((email) => String(email || "").trim().toLowerCase())
      .filter(Boolean)
  );
  const authIds = snapshot.authUser ? [snapshot.authUser.id] : [];
  const profileIds = unique(snapshot.profiles.map((row) => row.id));
  const candidateIds = unique(snapshot.candidates.map((row) => row.id));

  const steps: DeleteStep[] = [
    { table: "claim_artifacts", column: "user_id", values: authIds },
    { table: "claim_proof_documents", column: "user_id", values: authIds },
    { table: "claim_domain_verifications", column: "user_id", values: authIds },
    { table: "owner_codes", column: "handle", values: handles },
    { table: "email_codes", column: "email", values: emails },
    { table: "dossier_drafts", column: "auth_user_id", values: authIds },
    { table: "profiles", column: "id", values: profileIds },
    { table: "candidates", column: "id", values: candidateIds }
  ];
  return steps.filter((step) => step.values.length > 0);
}

export type ResetCaller = { id: string; email: string | null };

export function browserSessionCookieNames(names: string[]) {
  return names.filter((name) => name.startsWith("sb-") || APP_SESSION_COOKIES.includes(name));
}

export function shouldSignOutCaller(input: {
  dryRun: boolean;
  caller: ResetCaller | null | undefined;
  targetUserId: string | null;
  targetEmail: string | null;
}) {
  if (input.dryRun || !input.caller) return false;
  if (input.caller.id && input.targetUserId && input.caller.id === input.targetUserId) return true;
  const callerEmail = String(input.caller.email || "").trim().toLowerCase();
  const targetEmail = String(input.targetEmail || "").trim().toLowerCase();
  return Boolean(callerEmail && targetEmail && callerEmail === targetEmail);
}

export function resetWarnings(input: {
  dryRun: boolean;
  deleteAuthUser: boolean;
  sessionsRevoked: boolean;
  authUserDeleted: boolean;
  signOutRequired: boolean;
}) {
  const warnings = [
    "Proof this person submitted on someone else's dossier is left in place.",
    "Studio drafts stored in another browser stay there until that browser signs in again.",
    JWT_EXPIRY_CAVEAT
  ];
  if (input.dryRun) {
    warnings.push(input.deleteAuthUser ? "The login would be deleted when you run the reset." : "The login would be kept. This preview is app data only.");
  } else if (!input.authUserDeleted) {
    warnings.push("The login was kept. Choose “Also delete the auth login” to remove it.");
  }
  if (input.signOutRequired) {
    warnings.push("This browser will be signed out because the reset targeted the account you are using.");
  } else if (!input.dryRun && !input.sessionsRevoked && !input.authUserDeleted) {
    warnings.push("Other sessions for this login stay active.");
  }
  return warnings;
}

export async function runAdminReset(
  db: ResetDatabase,
  request: AdminResetRequest,
  caller?: ResetCaller | null
): Promise<
  | { ok: true; summary: ResetSummary }
  | { ok: false; status: number; error: string; table?: string; summary?: ResetSummary }
> {
  if (!request.dryRun && request.confirm !== RESET_CONFIRMATION) {
    return { ok: false, status: 400, error: "Type RESET to confirm this deletion." };
  }

  const snapshot = await db.load({ userId: request.userId, email: request.email });
  const steps = buildDeleteSteps(snapshot);
  const handles = unique(snapshot.candidates.map((row) => row.handle));
  const base: ResetSummary = {
    dryRun: request.dryRun,
    target: {
      userId: snapshot.authUser?.id || request.userId,
      email: snapshot.authUser?.email || request.email,
      handles
    },
    storageObjects: snapshot.storageObjects.map((object) => `${object.bucket}/${object.path}`),
    tables: { ...snapshot.counts },
    skippedCandidates: snapshot.skippedCandidates,
    sessionsRevoked: false,
    authUserDeleted: false,
    deleteAuthUser: request.deleteAuthUser,
    signOutRequired: false,
    warnings: resetWarnings({
      dryRun: request.dryRun,
      deleteAuthUser: request.deleteAuthUser,
      sessionsRevoked: false,
      authUserDeleted: false,
      signOutRequired: false
    })
  };

  if (!snapshot.authUser && snapshot.candidates.length === 0 && snapshot.profiles.length === 0) {
    return { ok: false, status: 404, error: "No login or dossier matched that email or user id.", summary: base };
  }

  if (request.dryRun) return { ok: true, summary: base };

  const deleted: Record<string, number> = {};
  try {
    await db.removeStorage(snapshot.storageObjects);
    for (const step of steps) {
      deleted[step.table] = await db.deleteRows(step.table, step.column, step.values);
    }
  } catch (error) {
    const table = error instanceof ResetBlockedError ? error.table : "reset";
    const message = error instanceof Error ? error.message : "Reset failed.";
    return {
      ok: false,
      status: 409,
      error: message,
      table,
      summary: {
        ...base,
        dryRun: false,
        tables: deleted,
        warnings: [`Stopped at ${table}. Earlier deletions in this request were not restored.`, ...base.warnings]
      }
    };
  }

  try {
    db.clearLocalCopy(snapshot.authUser?.id || null, handles);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not clear the local file copy.";
    return {
      ok: false,
      status: 409,
      error: message,
      table: "vault.json",
      summary: { ...base, dryRun: false, tables: withCascade(deleted, snapshot), warnings: [message, ...base.warnings] }
    };
  }

  let sessionsRevoked = false;
  let authUserDeleted = false;
  if (snapshot.authUser) {
    try {
      const revoked = await db.revokeSessions(snapshot.authUser.id);
      sessionsRevoked = revoked === "revoked";
      if (request.deleteAuthUser) {
        await db.deleteAuthUser(snapshot.authUser.id);
        authUserDeleted = true;
        sessionsRevoked = true;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not update the login.";
      return {
        ok: false,
        status: 409,
        error: message,
        table: "auth.users",
        summary: {
          ...base,
          dryRun: false,
          tables: withCascade(deleted, snapshot),
          sessionsRevoked,
          authUserDeleted: false,
          signOutRequired: request.deleteAuthUser && shouldSignOutCaller({
            dryRun: false,
            caller,
            targetUserId: base.target.userId,
            targetEmail: base.target.email
          }),
          warnings: [`Dossier rows were deleted. The login was not. ${message}`, ...base.warnings]
        }
      };
    }
  }

  const signOutRequired = shouldSignOutCaller({
    dryRun: false,
    caller,
    targetUserId: base.target.userId,
    targetEmail: base.target.email
  });
  return {
    ok: true,
    summary: {
      ...base,
      dryRun: false,
      tables: withCascade(deleted, snapshot),
      sessionsRevoked,
      authUserDeleted,
      signOutRequired,
      warnings: resetWarnings({
        dryRun: false,
        deleteAuthUser: request.deleteAuthUser,
        sessionsRevoked,
        authUserDeleted,
        signOutRequired
      })
    }
  };
}

function withCascade(deleted: Record<string, number>, snapshot: ResetSnapshot) {
  const tables = { ...deleted };
  if (deleted.candidates) {
    for (const table of CANDIDATE_CASCADE_TABLES) tables[table] = snapshot.counts[table] || 0;
  }
  if (deleted.profiles) {
    for (const table of PROFILE_CASCADE_TABLES) tables[table] = snapshot.counts[table] || 0;
  }
  return tables;
}

export function logAdminReset(entry: Record<string, unknown>) {
  console.info(JSON.stringify({ event: "admin_reset", at: new Date().toISOString(), ...entry }));
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}
