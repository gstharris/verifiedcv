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
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeStudioRecord(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(key, JSON.stringify(value));
}

export function clearStudioPortfolioStorage() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STUDIO_DRAFT_KEY);
  sessionStorage.removeItem(STUDIO_SAVED_KEY);
}
