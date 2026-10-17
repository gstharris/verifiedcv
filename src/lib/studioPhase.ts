export type StudioPhase =
  | "loading"
  | "signed_out"
  | "sign_in"
  | "empty"
  | "draft"
  | "live"
  | "live_dirty";

export type StudioPhaseInput = {
  authChecked: boolean;
  entryReady: boolean;
  vaultChecked: boolean;
  hasSession: boolean;
  signInRequested: boolean;
  hasReviewableContent: boolean;
  hasConfirmedLiveDossier: boolean;
  hasUnpublishedChanges: boolean;
};

export function resolveStudioPhase(input: StudioPhaseInput): StudioPhase {
  if (!input.authChecked || !input.entryReady) return "loading";
  if (input.hasSession && !input.vaultChecked) return "loading";

  if (!input.hasSession) {
    if (input.hasReviewableContent) return "draft";
    if (input.signInRequested) return "sign_in";
    return "signed_out";
  }

  if (input.hasConfirmedLiveDossier) {
    return input.hasUnpublishedChanges ? "live_dirty" : "live";
  }
  if (input.hasReviewableContent) return "draft";
  return "empty";
}
