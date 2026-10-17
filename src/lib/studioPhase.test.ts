import { describe, expect, it } from "vitest";
import { resolveStudioPhase, type StudioPhaseInput } from "./studioPhase";

function phase(overrides: Partial<StudioPhaseInput> = {}) {
  return resolveStudioPhase({
    authChecked: true,
    entryReady: true,
    vaultChecked: true,
    hasSession: false,
    signInRequested: false,
    hasReviewableContent: false,
    hasConfirmedLiveDossier: false,
    hasUnpublishedChanges: false,
    ...overrides
  });
}

describe("resolveStudioPhase", () => {
  it("stays loading until auth and the local entry read have settled", () => {
    expect(phase({ authChecked: false })).toBe("loading");
    expect(phase({ entryReady: false })).toBe("loading");
  });

  it("stays loading for a signed-in visitor until the vault check settles", () => {
    expect(phase({ hasSession: true, vaultChecked: false })).toBe("loading");
  });

  it("sends a signed-out visitor with nothing to review back to the start", () => {
    expect(phase()).toBe("signed_out");
  });

  it("shows sign-in only when it was requested and there is nothing to review", () => {
    expect(phase({ signInRequested: true })).toBe("sign_in");
    expect(phase({ signInRequested: true, hasReviewableContent: true })).toBe("draft");
  });

  it("keeps a signed-out parsed resume in the draft phase", () => {
    expect(phase({ hasReviewableContent: true })).toBe("draft");
  });

  it("shows an empty studio when the signed-in account has no dossier and no draft", () => {
    expect(phase({ hasSession: true })).toBe("empty");
  });

  it("shows a draft when the signed-in account has unpublished work and no live page", () => {
    expect(phase({ hasSession: true, hasReviewableContent: true })).toBe("draft");
  });

  it("does not open sign-in for an account that already has a session", () => {
    expect(phase({ hasSession: true, signInRequested: true })).toBe("empty");
  });

  it("distinguishes a confirmed live page from unpublished edits", () => {
    expect(phase({ hasSession: true, hasConfirmedLiveDossier: true, hasReviewableContent: true })).toBe("live");
    expect(
      phase({
        hasSession: true,
        hasConfirmedLiveDossier: true,
        hasReviewableContent: true,
        hasUnpublishedChanges: true
      })
    ).toBe("live_dirty");
  });
});