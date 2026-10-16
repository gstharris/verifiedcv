export type StudioActionId =
  | "upload_resume"
  | "paste_resume"
  | "save_portfolio"
  | "review_changes"
  | "continue_verification"
  | "ask_colleague"
  | "add_sample_work"
  | "edit_summary";

export type StudioAction = {
  id: StudioActionId;
  label: string;
};

export type StudioActionPlan = {
  primary: StudioAction;
  suggestions: StudioAction[];
};

export type StudioActionInput = {
  hasLivePage: boolean;
  hasContent: boolean;
  hasUnpublishedChanges: boolean;
  hasSummary: boolean;
  hasSampleWork: boolean;
  canAskColleague: boolean;
  nextStep: { id: string; title: string };
};

const SUGGESTION_LIMIT = 4;

function quietSuggestions(input: StudioActionInput, primary: StudioAction): StudioAction[] {
  const candidates: StudioAction[] = [];
  if (!input.hasSampleWork) candidates.push({ id: "add_sample_work", label: "Add sample work" });
  candidates.push({ id: "edit_summary", label: input.hasSummary ? "Edit summary" : "Add a summary" });
  if (input.canAskColleague) candidates.push({ id: "ask_colleague", label: "Ask a colleague" });
  if (input.nextStep.id !== "done") {
    candidates.push({ id: "continue_verification", label: input.nextStep.title });
  }
  return candidates
    .filter((action) => action.id !== primary.id && action.label !== primary.label)
    .slice(0, SUGGESTION_LIMIT);
}

export function suggestStudioActions(input: StudioActionInput): StudioActionPlan {
  if (!input.hasLivePage && !input.hasContent) {
    return {
      primary: { id: "upload_resume", label: "Upload a resume" },
      suggestions: [{ id: "paste_resume", label: "Paste instead" }]
    };
  }

  if (!input.hasLivePage) {
    return {
      primary: { id: "save_portfolio", label: "Save and publish" },
      suggestions: []
    };
  }

  if (input.hasUnpublishedChanges) {
    const primary: StudioAction = { id: "review_changes", label: "Review changes" };
    return { primary, suggestions: quietSuggestions(input, primary) };
  }

  const primary: StudioAction =
    input.nextStep.id === "done"
      ? { id: "ask_colleague", label: "Ask a colleague" }
      : { id: "continue_verification", label: input.nextStep.title };

  return { primary, suggestions: quietSuggestions(input, primary) };
}

export function unknownStudioReply(primaryLabel: string, hasLivePage: boolean) {
  if (hasLivePage) {
    return `${primaryLabel} is the next step. Edits stay in your draft until you publish.`;
  }
  return `${primaryLabel} is the next step.`;
}
