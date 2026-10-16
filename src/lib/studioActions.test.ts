import { describe, expect, it } from "vitest";
import { suggestStudioActions, unknownStudioReply, type StudioActionInput } from "./studioActions";

const base: StudioActionInput = {
  hasLivePage: true,
  hasContent: true,
  hasUnpublishedChanges: false,
  hasSummary: false,
  hasSampleWork: false,
  canAskColleague: true,
  nextStep: { id: "email", title: "Verify your email" }
};

function labels(input: StudioActionInput) {
  const plan = suggestStudioActions(input);
  return [plan.primary.label, ...plan.suggestions.map((action) => action.label)];
}

describe("suggestStudioActions", () => {
  it("asks for a resume before there is a page or any content", () => {
    const plan = suggestStudioActions({ ...base, hasLivePage: false, hasContent: false });
    expect(plan.primary).toEqual({ id: "upload_resume", label: "Upload a resume" });
    expect(plan.suggestions).toEqual([{ id: "paste_resume", label: "Paste instead" }]);
  });

  it("asks to save and publish once content exists and the page is not live", () => {
    const plan = suggestStudioActions({ ...base, hasLivePage: false, hasContent: true });
    expect(plan.primary).toEqual({ id: "save_portfolio", label: "Save and publish" });
    expect(plan.suggestions).toEqual([]);
  });

  it("uses Review changes as the only primary action while edits are unpublished", () => {
    const plan = suggestStudioActions({ ...base, hasUnpublishedChanges: true, hasSummary: true });
    expect(plan.primary).toEqual({ id: "review_changes", label: "Review changes" });
    expect(plan.suggestions.map((action) => action.id)).not.toContain("save_portfolio");
    expect(plan.suggestions.map((action) => action.label)).toContain("Edit summary");
    expect(plan.suggestions.map((action) => action.label)).toContain("Verify your email");
  });

  it("uses the next verification step when the live page matches the editor", () => {
    const plan = suggestStudioActions(base);
    expect(plan.primary).toEqual({ id: "continue_verification", label: "Verify your email" });
    expect(plan.suggestions.map((action) => action.label)).not.toContain("Verify your email");
  });

  it("asks a colleague once verification is caught up", () => {
    const plan = suggestStudioActions({
      ...base,
      hasSummary: true,
      hasSampleWork: true,
      nextStep: { id: "done", title: "Portfolio verification is in good shape" }
    });
    expect(plan.primary).toEqual({ id: "ask_colleague", label: "Ask a colleague" });
    expect(plan.suggestions.map((action) => action.label)).not.toContain("Ask a colleague");
    expect(plan.suggestions.map((action) => action.label)).not.toContain("Portfolio verification is in good shape");
  });

  it("skips sample work and colleague suggestions that are already done", () => {
    const plan = suggestStudioActions({
      ...base,
      hasSampleWork: true,
      canAskColleague: false,
      hasSummary: true
    });
    const suggestionLabels = plan.suggestions.map((action) => action.label);
    expect(suggestionLabels).not.toContain("Add sample work");
    expect(suggestionLabels).not.toContain("Ask a colleague");
    expect(suggestionLabels).toContain("Edit summary");
  });

  it("never suggests replace source, cancel, or section removal", () => {
    const cases = [
      base,
      { ...base, hasUnpublishedChanges: true },
      { ...base, hasLivePage: false, hasContent: false },
      { ...base, hasLivePage: false, hasContent: true },
      { ...base, nextStep: { id: "done", title: "Ask a colleague" } }
    ];
    for (const input of cases) {
      const text = labels(input).join(" ").toLowerCase();
      expect(text).not.toMatch(/replace source|cancel changes|remove summary|remove highlights|remove chapter/);
    }
  });
});

describe("unknownStudioReply", () => {
  it("names the primary action and keeps live edits in the draft", () => {
    expect(unknownStudioReply("Review changes", true)).toBe(
      "Review changes is the next step. Edits stay in your draft until you publish."
    );
    expect(unknownStudioReply("Upload a resume", false)).toBe("Upload a resume is the next step.");
  });
});
