import { describe, expect, it } from "vitest";
import {
  authorizeAdminReset,
  browserSessionCookieNames,
  buildDeleteSteps,
  ownedStoragePath,
  parseAdminResetRequest,
  runAdminReset,
  selectOwnedCandidates,
  shouldSignOutCaller,
  storagePathFromUrl,
  type ResetDatabase,
  type ResetSnapshot
} from "./adminReset";

const snapshot: ResetSnapshot = {
  authUser: { id: "11111111-1111-4111-8111-111111111111", email: "tester@example.com" },
  candidates: [
    { id: "22222222-2222-4222-8222-222222222222", handle: "tester", email: "tester@example.com", authUserId: "11111111-1111-4111-8111-111111111111" }
  ],
  skippedCandidates: [],
  profiles: [{ id: "33333333-3333-4333-8333-333333333333", handle: "tester" }],
  counts: {
    claim_artifacts: 1,
    dossier_drafts: 1,
    candidates: 1,
    profiles: 1,
    milestones: 2,
    skills: 3,
    claims: 4
  },
  storageObjects: [{ bucket: "portfolio-assets", path: "tester/one.pdf" }]
};

function database(overrides: Partial<ResetDatabase> = {}): ResetDatabase & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    async load() {
      calls.push("load");
      return snapshot;
    },
    async removeStorage() {
      calls.push("storage");
      return 1;
    },
    async deleteRows(table) {
      calls.push(`delete:${table}`);
      return 1;
    },
    async revokeSessions() {
      calls.push("sessions");
      return "unsupported";
    },
    async deleteAuthUser() {
      calls.push("auth-user");
    },
    clearLocalCopy() {
      calls.push("local");
    },
    ...overrides
  };
}

describe("admin reset authorization", () => {
  it("rejects a missing session", () => {
    const access = authorizeAdminReset({ callerEmail: null, nodeEnv: "development", allowlist: ["admin@example.com"] });
    expect(access).toEqual({ ok: false, status: 401, error: "Sign in first." });
  });

  it("rejects a signed-in user who is outside the production allowlist", () => {
    const access = authorizeAdminReset({
      callerEmail: "person@example.com",
      nodeEnv: "production",
      allowlist: ["admin@example.com"]
    });
    expect(access.ok).toBe(false);
    if (!access.ok) expect(access.status).toBe(403);
  });

  it("allows an allowlisted email in production, ignoring case", () => {
    const access = authorizeAdminReset({
      callerEmail: "Admin@Example.com",
      nodeEnv: "production",
      allowlist: ["admin@example.com"]
    });
    expect(access).toEqual({ ok: true });
  });

  it("allows any signed-in user in development", () => {
    const access = authorizeAdminReset({
      callerEmail: "person@example.com",
      nodeEnv: "development",
      allowlist: []
    });
    expect(access).toEqual({ ok: true });
  });
});

describe("admin reset dry run", () => {
  it("previews rows and storage without deleting when confirmation is missing", async () => {
    const db = database();
    const parsed = parseAdminResetRequest({ email: "tester@example.com" });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const result = await runAdminReset(db, parsed.request);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.summary.dryRun).toBe(true);
    expect(result.summary.tables.milestones).toBe(2);
    expect(result.summary.storageObjects).toEqual(["portfolio-assets/tester/one.pdf"]);
    expect(result.summary.authUserDeleted).toBe(false);
    expect(db.calls).toEqual(["load"]);
  });

  it("refuses an execute that does not type RESET", async () => {
    const db = database();
    const result = await runAdminReset(db, {
      userId: null,
      email: "tester@example.com",
      dryRun: false,
      confirm: "reset",
      deleteAuthUser: true
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
    expect(db.calls).toEqual([]);
  });

  it("deletes dossier rows before the login, and keeps the login unless asked", async () => {
    const db = database();
    const result = await runAdminReset(db, {
      userId: null,
      email: "tester@example.com",
      dryRun: false,
      confirm: "RESET",
      deleteAuthUser: false
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.summary.authUserDeleted).toBe(false);
    expect(result.summary.tables.candidates).toBe(1);
    expect(result.summary.tables.milestones).toBe(2);
    const candidateIndex = db.calls.indexOf("delete:candidates");
    const authIndex = db.calls.indexOf("auth-user");
    expect(candidateIndex).toBeGreaterThan(db.calls.indexOf("storage"));
    expect(candidateIndex).toBeGreaterThan(db.calls.indexOf("delete:dossier_drafts"));
    expect(authIndex).toBe(-1);
    expect(db.calls.at(-2)).toBe("local");
    expect(db.calls.at(-1)).toBe("sessions");
  });

  it("deletes the auth user last when requested", async () => {
    const db = database();
    const result = await runAdminReset(db, {
      userId: "11111111-1111-4111-8111-111111111111",
      email: null,
      dryRun: false,
      confirm: "RESET",
      deleteAuthUser: true
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.summary.authUserDeleted).toBe(true);
    expect(result.summary.sessionsRevoked).toBe(true);
    expect(db.calls.at(-1)).toBe("auth-user");
  });

  it("stops when a foreign key blocks a table and does not delete the login", async () => {
    const db = database({
      async deleteRows(table) {
        db.calls.push(`delete:${table}`);
        if (table === "candidates") {
          const { ResetBlockedError } = await import("./adminReset");
          throw new ResetBlockedError("candidates", "candidates_auth_user_id_fkey");
        }
        return 1;
      }
    });
    const result = await runAdminReset(db, {
      userId: null,
      email: "tester@example.com",
      dryRun: false,
      confirm: "RESET",
      deleteAuthUser: true
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(409);
    expect(result.table).toBe("candidates");
    expect(db.calls).not.toContain("auth-user");
  });

  it("leaves a dossier that belongs to a different login", () => {
    const selected = selectOwnedCandidates(
      [
        { id: "a", handle: "mine", email: "tester@example.com", authUserId: "11111111-1111-4111-8111-111111111111" },
        { id: "b", handle: "theirs", email: "tester@example.com", authUserId: "99999999-9999-4999-8999-999999999999" }
      ],
      { id: "11111111-1111-4111-8111-111111111111", email: "tester@example.com" }
    );
    expect(selected.owned.map((row) => row.handle)).toEqual(["mine"]);
    expect(selected.skipped[0]?.handle).toBe("theirs");
  });

  it("only accepts storage paths owned by the target", () => {
    expect(storagePathFromUrl("https://example.supabase.co/storage/v1/object/public/portfolio-assets/tester/one.pdf?t=1")).toBe(
      "tester/one.pdf"
    );
    expect(storagePathFromUrl("https://example.supabase.co/storage/v1/object/public/portfolio-assets/../secrets")).toBeNull();
    expect(
      ownedStoragePath("https://cdn.example/portfolio-assets/someone-else/file.pdf", {
        handles: ["tester"],
        userId: "11111111-1111-4111-8111-111111111111"
      })
    ).toBeNull();
  });

  it("defaults to a dry run that keeps the login", () => {
    const parsed = parseAdminResetRequest({ email: "tester@example.com", confirm: "RESET", deleteAuthUser: "yes" });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.request.dryRun).toBe(true);
    expect(parsed.request.deleteAuthUser).toBe(false);
  });

  it("signs out the caller after a successful reset of their own account", async () => {
    const db = database();
    const caller = { id: "11111111-1111-4111-8111-111111111111", email: "admin@example.com" };
    const preview = await runAdminReset(
      db,
      { userId: caller.id, email: null, dryRun: true, confirm: "", deleteAuthUser: false },
      caller
    );
    expect(preview.ok).toBe(true);
    if (!preview.ok) return;
    expect(preview.summary.signOutRequired).toBe(false);
    expect(db.calls).toEqual(["load"]);

    const result = await runAdminReset(
      db,
      { userId: null, email: "tester@example.com", dryRun: false, confirm: "RESET", deleteAuthUser: false },
      { id: "99999999-9999-4999-8999-999999999999", email: "tester@example.com" }
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.summary.signOutRequired).toBe(true);
    expect(result.summary.authUserDeleted).toBe(false);
    expect(result.summary.deleteAuthUser).toBe(false);
    expect(result.summary.warnings.some((warning) => warning.includes("until it expires"))).toBe(true);
  });

  it("leaves the caller signed in when the reset targets someone else", () => {
    expect(shouldSignOutCaller({
      dryRun: false,
      caller: { id: "11111111-1111-4111-8111-111111111111", email: "admin@example.com" },
      targetUserId: "99999999-9999-4999-8999-999999999999",
      targetEmail: "tester@example.com"
    })).toBe(false);
    expect(browserSessionCookieNames(["sb-project-auth-token", "sb-project-auth-token.0", "theme", "vcv_handle_owner"])).toEqual([
      "sb-project-auth-token",
      "sb-project-auth-token.0",
      "vcv_handle_owner"
    ]);
  });

  it("orders explicit deletes so the candidate row is removed before the auth user can be", () => {
    const tables = buildDeleteSteps(snapshot).map((step) => step.table);
    expect(tables.indexOf("dossier_drafts")).toBeLessThan(tables.indexOf("candidates"));
    expect(tables.indexOf("profiles")).toBeLessThan(tables.indexOf("candidates"));
    expect(tables.at(-1)).toBe("candidates");
  });
});
