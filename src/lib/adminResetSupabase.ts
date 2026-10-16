import type { SupabaseClient } from "@supabase/supabase-js";
import {
  PORTFOLIO_BUCKET,
  ResetBlockedError,
  ownedStoragePath,
  selectOwnedCandidates,
  type CandidateMatch,
  type ResetDatabase,
  type ResetSnapshot
} from "./adminReset";
import { deleteFileDraft, deleteVaultHandles } from "./store";

type AuthUser = { id: string; email: string | null };

export function createSupabaseResetDatabase(admin: SupabaseClient, auth: { url: string; serviceRoleKey: string }): ResetDatabase {
  return {
    async load(target) {
      const authUser = await findAuthUser(admin, auth, target);
      const email = authUser?.email || target.email;
      const candidates = await loadCandidates(admin, authUser, email);
      const profiles = await loadProfiles(admin, authUser?.id || null, candidates.owned);
      const handles = candidates.owned.map((row) => row.handle);
      const candidateIds = candidates.owned.map((row) => row.id);
      const profileIds = profiles.map((row) => row.id);
      const milestoneIds = await idsBy(admin, "milestones", "id", "candidate_handle", handles);
      const counts: Record<string, number> = {};

      counts.claim_artifacts = await countBy(admin, "claim_artifacts", "user_id", authUser ? [authUser.id] : []);
      counts.claim_proof_documents = await countBy(admin, "claim_proof_documents", "user_id", authUser ? [authUser.id] : []);
      counts.claim_domain_verifications = await countBy(admin, "claim_domain_verifications", "user_id", authUser ? [authUser.id] : []);
      counts.owner_codes = await countBy(admin, "owner_codes", "handle", handles);
      counts.email_codes = await countBy(admin, "email_codes", "email", emailsFor(authUser, candidates.owned));
      counts.dossier_drafts = await countBy(admin, "dossier_drafts", "auth_user_id", authUser ? [authUser.id] : []);
      counts.profiles = profiles.length;
      counts.candidates = candidates.owned.length;
      counts.milestones = milestoneIds.length;
      counts.artifacts = await countBy(admin, "artifacts", "milestone_id", milestoneIds);
      counts.registry_links = await countBy(admin, "registry_links", "milestone_id", milestoneIds);
      counts.verifications = await countBy(admin, "verifications", "milestone_id", milestoneIds);
      counts.education = await countBy(admin, "education", "candidate_handle", handles);
      counts.skills = await countBy(admin, "skills", "candidate_handle", handles);
      counts.portfolio_assets = await countBy(admin, "portfolio_assets", "candidate_handle", handles);
      counts.attestations = await countBy(admin, "attestations", "candidate_handle", handles);
      counts.experiences = await countBy(admin, "experiences", "candidate_id", candidateIds);
      counts.resumes = await countBy(admin, "resumes", "candidate_id", candidateIds);
      counts.impact_claims = await countBy(admin, "impact_claims", "candidate_id", candidateIds);
      counts.peer_attestations = await countBy(admin, "peer_attestations", "inviter_candidate_id", candidateIds);
      counts.claims = await countBy(admin, "claims", "user_id", profileIds);
      counts.claim_audits = await countBy(admin, "claim_audits", "user_id", profileIds);
      counts.claim_attestations = await countBy(admin, "claim_attestations", "candidate_id", profileIds);
      counts.profile_views = await countBy(admin, "profile_views", "user_id", profileIds);
      counts.trust_artifacts = await countBy(admin, "trust_artifacts", "candidate_id", profileIds);
      counts.audit_context = await countBy(admin, "audit_context", "user_id", profileIds);

      const storageObjects = await listOwnedStorage(admin, {
        handles,
        userId: authUser?.id || null,
        candidateIds,
        profileIds
      });

      return {
        authUser,
        candidates: candidates.owned,
        skippedCandidates: candidates.skipped,
        profiles,
        counts,
        storageObjects
      } satisfies ResetSnapshot;
    },

    async removeStorage(objects) {
      const byBucket = new Map<string, string[]>();
      for (const object of objects) {
        const paths = byBucket.get(object.bucket) || [];
        paths.push(object.path);
        byBucket.set(object.bucket, paths);
      }
      let removed = 0;
      for (const [bucket, paths] of byBucket) {
        for (let index = 0; index < paths.length; index += 100) {
          const chunk = paths.slice(index, index + 100);
          const { error } = await admin.storage.from(bucket).remove(chunk);
          if (error) throw new ResetBlockedError("storage", error.message || "Could not delete storage objects.");
          removed += chunk.length;
        }
      }
      return removed;
    },

    async deleteRows(table, column, values) {
      if (values.length === 0) return 0;
      const { error, count } = await admin.from(table).delete({ count: "exact" }).in(column, values);
      if (error) {
        if (error.code === "23503" || /foreign key/i.test(error.message || "")) {
          throw new ResetBlockedError(table, error.message || `A foreign key blocked deletion from ${table}.`);
        }
        throw new ResetBlockedError(table, error.message || `Could not delete ${table}.`);
      }
      return count ?? values.length;
    },

    async revokeSessions(userId) {
      const response = await fetch(`${auth.url}/auth/v1/admin/users/${userId}/logout`, {
        method: "POST",
        headers: authHeaders(auth.serviceRoleKey)
      });
      if (response.status === 404) return "unsupported";
      if (!response.ok) {
        const detail = (await response.text()).slice(0, 180);
        throw new Error(detail || `Could not revoke sessions (${response.status}).`);
      }
      return "revoked";
    },

    async deleteAuthUser(userId) {
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) throw new Error(error.message || "Could not delete the auth user.");
    },

    clearLocalCopy(authUserId, handles) {
      if (authUserId) deleteFileDraft(authUserId);
      deleteVaultHandles(handles);
    }
  };
}

function authHeaders(serviceRoleKey: string) {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json"
  };
}

async function findAuthUser(
  admin: SupabaseClient,
  auth: { url: string; serviceRoleKey: string },
  target: { userId: string | null; email: string | null }
): Promise<AuthUser | null> {
  if (target.userId) {
    const { data, error } = await admin.auth.admin.getUserById(target.userId);
    if (error) {
      if (/not found/i.test(error.message || "")) return null;
      throw new ResetBlockedError("auth.users", error.message || "Could not look up that user.");
    }
    if (!data.user) return null;
    return { id: data.user.id, email: data.user.email || null };
  }

  const response = await fetch(`${auth.url}/auth/v1/admin/users?filter=${encodeURIComponent(target.email || "")}`, {
    headers: authHeaders(auth.serviceRoleKey)
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 180);
    throw new ResetBlockedError("auth.users", detail || "Could not look up that email.");
  }
  const body = (await response.json()) as { users?: { id?: string; email?: string | null }[] };
  const matches = (body.users || []).filter((user) => String(user.email || "").trim().toLowerCase() === target.email && user.id);
  if (matches.length > 1) {
    throw new ResetBlockedError("auth.users", "More than one login uses that email. Reset by user id instead.");
  }
  if (!matches[0]?.id) return null;
  return { id: matches[0].id, email: matches[0].email || target.email };
}

async function loadCandidates(admin: SupabaseClient, authUser: AuthUser | null, email: string | null) {
  const rows: CandidateMatch[] = [];
  if (authUser) {
    const { data, error } = await admin.from("candidates").select("id, handle, email, auth_user_id").eq("auth_user_id", authUser.id);
    if (error) throw new ResetBlockedError("candidates", error.message || "Could not read dossiers.");
    rows.push(...(data || []).map(candidateFromRow));
  }
  if (email) {
    const { data, error } = await admin.from("candidates").select("id, handle, email, auth_user_id").ilike("email", email);
    if (error) throw new ResetBlockedError("candidates", error.message || "Could not read dossiers.");
    for (const row of data || []) {
      const candidate = candidateFromRow(row);
      if (!rows.some((existing) => existing.id === candidate.id)) rows.push(candidate);
    }
  }
  return selectOwnedCandidates(rows, authUser);
}

async function loadProfiles(admin: SupabaseClient, authUserId: string | null, candidates: CandidateMatch[]) {
  const profiles: { id: string; handle: string | null }[] = [];
  const handles = candidates.map((row) => row.handle);
  const ids = [...candidates.map((row) => row.id), ...(authUserId ? [authUserId] : [])];
  if (ids.length > 0) {
    const { data, error } = await admin.from("profiles").select("id, handle").in("id", ids);
    if (error) throw new ResetBlockedError("profiles", error.message || "Could not read profiles.");
    profiles.push(...(data || []).map((row) => ({ id: String(row.id), handle: row.handle ? String(row.handle) : null })));
  }
  if (handles.length > 0) {
    const { data, error } = await admin.from("profiles").select("id, handle").in("handle", handles);
    if (error) throw new ResetBlockedError("profiles", error.message || "Could not read profiles.");
    for (const row of data || []) {
      const profile = { id: String(row.id), handle: row.handle ? String(row.handle) : null };
      if (!profiles.some((existing) => existing.id === profile.id)) profiles.push(profile);
    }
  }
  return profiles;
}

async function listOwnedStorage(
  admin: SupabaseClient,
  owners: { handles: string[]; userId: string | null; candidateIds: string[]; profileIds: string[] }
) {
  const paths = new Set<string>();
  for (const folder of [...owners.handles, ...(owners.userId ? [owners.userId] : [])]) {
    for (const path of await listFolder(admin, folder)) paths.add(path);
  }
  const urls = [
    ...(await textColumn(admin, "portfolio_assets", "url", "candidate_handle", owners.handles)),
    ...(await textColumn(admin, "resumes", "file_url", "candidate_id", owners.candidateIds)),
    ...(await textColumn(admin, "claim_artifacts", "storage_url", "user_id", owners.userId ? [owners.userId] : [])),
    ...(await textColumn(admin, "claim_artifacts", "thumbnail_url", "user_id", owners.userId ? [owners.userId] : [])),
    ...(await textColumn(admin, "claim_proof_documents", "file_url", "user_id", owners.userId ? [owners.userId] : []))
  ];
  for (const url of urls) {
    const path = ownedStoragePath(url, owners);
    if (path) paths.add(path);
  }
  return [...paths].map((path) => ({ bucket: PORTFOLIO_BUCKET, path }));
}

async function listFolder(admin: SupabaseClient, folder: string) {
  const paths: string[] = [];
  for (let offset = 0; offset < 1000; offset += 100) {
    const { data, error } = await admin.storage.from(PORTFOLIO_BUCKET).list(folder, { limit: 100, offset });
    if (error) {
      if (/not found|bucket/i.test(error.message || "")) return paths;
      throw new ResetBlockedError("storage", error.message || "Could not list storage objects.");
    }
    if (!data?.length) break;
    for (const item of data) {
      if (item.id && item.name) paths.push(`${folder}/${item.name}`);
    }
    if (data.length < 100) break;
  }
  return paths;
}

async function countBy(admin: SupabaseClient, table: string, column: string, values: string[]) {
  if (values.length === 0) return 0;
  const { count, error } = await admin.from(table).select("*", { count: "exact", head: true }).in(column, values);
  if (error) throw new ResetBlockedError(table, error.message || `Could not count ${table}.`);
  return count || 0;
}

async function idsBy(admin: SupabaseClient, table: string, idColumn: string, filterColumn: string, values: string[]) {
  if (values.length === 0) return [];
  const { data, error } = await admin.from(table).select(idColumn).in(filterColumn, values);
  if (error) throw new ResetBlockedError(table, error.message || `Could not read ${table}.`);
  return (data || []).map((row) => String((row as Record<string, unknown>)[idColumn] || "")).filter(Boolean);
}

async function textColumn(admin: SupabaseClient, table: string, column: string, filterColumn: string, values: string[]) {
  if (values.length === 0) return [];
  const { data, error } = await admin.from(table).select(column).in(filterColumn, values);
  if (error) throw new ResetBlockedError(table, error.message || `Could not read ${table}.`);
  return (data || []).map((row) => String((row as Record<string, unknown>)[column] || "")).filter(Boolean);
}

function candidateFromRow(row: { id: string; handle: string; email: string | null; auth_user_id: string | null }): CandidateMatch {
  return {
    id: String(row.id),
    handle: String(row.handle),
    email: row.email ? String(row.email) : null,
    authUserId: row.auth_user_id ? String(row.auth_user_id) : null
  };
}

function emailsFor(authUser: AuthUser | null, candidates: CandidateMatch[]) {
  return [...new Set([authUser?.email, ...candidates.map((row) => row.email)].map((email) => String(email || "").trim().toLowerCase()).filter(Boolean))];
}
