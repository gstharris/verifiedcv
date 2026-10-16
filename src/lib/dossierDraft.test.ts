import { describe, expect, it } from "vitest";
import {
  PUBLIC_CANDIDATE_COLUMNS,
  applyIdentityPatch,
  applyIdentityToDraft,
  decideDraftHandle,
  deleteDraftsForPublish,
  deleteStoredDraft,
  draftDeleteIsMissingTable,
  identityColumnsAreNarrow,
  draftDeleteBlocksCancel,
  isExplicitPublish,
  parseIdentityPatch,
  publicVaultRecord,
  sanitizeDraftPayload,
  writeStoredDraft,
  type CandidateIdentity
} from "./dossierDraft";

const liveIdentity: CandidateIdentity = {
  email: "graham@example.com",
  phone: "4155550100",
  linkedin: "gharris",
  emailVerified: true,
  phoneVerified: true,
  linkedinVerified: true,
  linkedinSub: "live-sub"
};

describe("dossier draft storage", () => {
  it("keeps the public candidate select free of draft fields", () => {
    expect(PUBLIC_CANDIDATE_COLUMNS).not.toMatch(/draft|payload|auth_user_id|linkedin_sub/i);
  });

  it("strips draft and owner secrets from a public vault record", () => {
    const stored = publicVaultRecord({
      handle: "gharris",
      summaryStatement: "Live",
      ownerTokenHash: "secret",
      draft: { summaryStatement: "Hidden" },
      draftPayload: { summaryStatement: "Hidden" }
    });

    expect(stored).toEqual({ handle: "gharris", summaryStatement: "Live" });
  });

  it("stores a draft beside dossiers and delete removes only that draft", () => {
    const dossiers = {
      gharris: { handle: "gharris", summaryStatement: "Live", milestones: [{ id: "m1" }] }
    };
    const withDraft = writeStoredDraft(dossiers, "user-1", {
      handle: "gharris",
      payload: { summaryStatement: "Draft", milestones: [{ id: "m2" }] },
      updatedAt: "2026-10-16T00:00:00.000Z"
    });
    const cleared = deleteStoredDraft(withDraft, "user-1");

    expect(cleared.gharris).toEqual(dossiers.gharris);
    expect(cleared).not.toHaveProperty("__dossier_drafts");
    expect(dossiers).not.toHaveProperty("__dossier_drafts");
  });

  it("clears only the publishing user's draft when the publish is tied to an account", () => {
    const store = writeStoredDraft(
      writeStoredDraft(
        { gharris: { handle: "gharris", summaryStatement: "Live" } },
        "user-1",
        { handle: "gharris", payload: { summaryStatement: "Mine" }, updatedAt: "2026-10-16T00:00:00.000Z" }
      ),
      "user-2",
      { handle: "gharris", payload: { summaryStatement: "Theirs" }, updatedAt: "2026-10-16T00:00:00.000Z" }
    );

    const cleared = deleteDraftsForPublish(store, { authUserId: "user-1", handle: "gharris" });
    expect(cleared.gharris).toEqual({ handle: "gharris", summaryStatement: "Live" });
    expect(cleared.__dossier_drafts).toEqual({
      "user-2": { handle: "gharris", payload: { summaryStatement: "Theirs" }, updatedAt: "2026-10-16T00:00:00.000Z" }
    });
  });

  it("rejects a draft that is not an object and drops owner tokens", () => {
    expect(sanitizeDraftPayload(["nope"]).ok).toBe(false);
    const sanitized = sanitizeDraftPayload({
      summaryStatement: "Draft",
      ownerTokenHash: "secret",
      milestones: [{ id: "m1" }]
    });
    expect(sanitized.ok).toBe(true);
    if (!sanitized.ok) return;
    expect(sanitized.payload).toEqual({ summaryStatement: "Draft", milestones: [{ id: "m1" }] });
  });

  it("keeps a draft on the owner's handle and rejects someone else's handle", () => {
    expect(decideDraftHandle({ requestedHandle: "gharris", ownerHandle: "gharris" })).toEqual({
      ok: true,
      handle: "gharris"
    });
    expect(decideDraftHandle({ requestedHandle: "other", ownerHandle: "gharris" }).ok).toBe(false);
    expect(
      decideDraftHandle({ requestedHandle: "taken", ownerHandle: "", requestedHandleTakenBySomeoneElse: true }).ok
    ).toBe(false);
    expect(decideDraftHandle({ requestedHandle: "", ownerHandle: "" })).toEqual({ ok: true, handle: "" });
    expect(decideDraftHandle({ requestedHandle: "studio", ownerHandle: "" }).ok).toBe(false);
  });

  it("treats a missing draft table as already clear", () => {
    expect(draftDeleteIsMissingTable("relation \"public.dossier_drafts\" does not exist", "42P01")).toBe(true);
    expect(draftDeleteIsMissingTable("permission denied for table candidates", "42501")).toBe(false);
  });
});

describe("identity patch", () => {
  it("updates only the contact field that changed and clears its flag", () => {
    const applied = applyIdentityPatch(liveIdentity, { email: "new@example.com" });

    expect(applied.columns).toEqual({ email: "new@example.com", email_verified: false });
    expect(identityColumnsAreNarrow(applied.columns)).toBe(true);
    expect(applied.next.phoneVerified).toBe(true);
    expect(applied.next.linkedinVerified).toBe(true);
  });

  it("keeps a verification flag when the value is the same aside from formatting", () => {
    const applied = applyIdentityPatch(liveIdentity, {
      email: "Graham@Example.com",
      phone: "+1 (415) 555-0100",
      linkedin: "https://www.linkedin.com/in/gharris"
    });

    expect(applied.columns.email_verified).toBeUndefined();
    expect(applied.columns.phone_verified).toBeUndefined();
    expect(applied.columns.linkedin_verified).toBeUndefined();
    expect(applied.next.emailVerified).toBe(true);
    expect(applied.next.linkedin).toBe("https://www.linkedin.com/in/gharris");
  });

  it("honors an explicit verification flag", () => {
    const applied = applyIdentityPatch(
      { ...liveIdentity, emailVerified: false },
      { email: "graham@example.com", emailVerified: true }
    );
    expect(applied.columns).toEqual({ email: "graham@example.com", email_verified: true });
  });

  it("patches draft contact without rewriting the rest of the dossier", () => {
    const milestones = [{ id: "m1", company: "Acme", claims: ["Shipped the onboarding flow."] }];
    const next = applyIdentityToDraft(
      { summaryStatement: "Draft summary", milestones, contact: { email: "graham@example.com", location: "Austin" } },
      liveIdentity,
      { email: "new@example.com", emailVerified: true, linkedinSub: "new-sub" }
    );

    expect(next.summaryStatement).toBe("Draft summary");
    expect(next.milestones).toEqual(milestones);
    expect(next.contact).toMatchObject({
      email: "new@example.com",
      emailVerified: true,
      location: "Austin"
    });
    expect(next.email).toBe("new@example.com");
    expect(next.linkedinSub).toBe("new-sub");
  });

  it("treats only an explicit publish header as a live write", () => {
    expect(isExplicitPublish("1")).toBe(true);
    expect(isExplicitPublish(null)).toBe(false);
    expect(isExplicitPublish("true")).toBe(false);
  });

  it("lets a local-only draft cancel when the server has nothing to delete", () => {
    expect(draftDeleteBlocksCancel(200, true)).toBe(false);
    expect(draftDeleteBlocksCancel(200, false)).toBe(false);
    expect(draftDeleteBlocksCancel(401, false)).toBe(false);
    expect(draftDeleteBlocksCancel(404, false)).toBe(false);
    expect(draftDeleteBlocksCancel(503, false)).toBe(false);
    expect(draftDeleteBlocksCancel(401, true)).toBe(true);
    expect(draftDeleteBlocksCancel(503, true)).toBe(true);
    expect(draftDeleteBlocksCancel(500, false)).toBe(true);
  });

  it("ignores unrelated keys and rejects an empty update", () => {
    const parsed = parseIdentityPatch({ handle: "gharris", headline: "Ignored", emailVerified: true });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.patch).toEqual({ emailVerified: true });
    expect(parseIdentityPatch({ handle: "gharris" }).ok).toBe(false);
  });
});
