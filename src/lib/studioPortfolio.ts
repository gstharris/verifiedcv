export const STUDIO_DRAFT_KEY = "vcv_studio_draft";
export const STUDIO_SAVED_KEY = "vcv_saved_vault";

export function hasPortfolioContent(portfolio: {
  milestones?: unknown[];
  summaryStatement?: string;
}) {
  return Boolean(
    (Array.isArray(portfolio.milestones) && portfolio.milestones.length > 0) ||
      (portfolio.summaryStatement && portfolio.summaryStatement.trim().length > 0)
  );
}

export function readStudioRecord<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeStudioRecord(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function clearStudioPortfolioStorage() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STUDIO_DRAFT_KEY);
  localStorage.removeItem(STUDIO_SAVED_KEY);
}

export function unverifiedContact<T extends { emailVerified?: boolean; phoneVerified?: boolean; linkedinVerified?: boolean }>(
  contact: T
): T {
  return {
    ...contact,
    emailVerified: false,
    phoneVerified: false,
    linkedinVerified: false
  };
}

export function stripProofFromMilestones<T extends { artifacts?: unknown[]; verifications?: unknown[] }>(
  milestones: T[]
): T[] {
  return milestones.map((milestone) => ({
    ...milestone,
    artifacts: [],
    verifications: []
  }));
}
