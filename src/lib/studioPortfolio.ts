export const STUDIO_DRAFT_KEY = "vcv_studio_draft";
export const STUDIO_SAVED_KEY = "vcv_saved_vault";
const STUDIO_SESSION_KEY = "vcv_studio_session";

let boundAccountId: string | null = null;

export function bindStudioAccount(accountId: string | null) {
  boundAccountId = accountId;
}

export function studioSessionId() {
  if (typeof window === "undefined") return "";
  try {
    const existing = sessionStorage.getItem(STUDIO_SESSION_KEY);
    if (existing) return existing;
    const created = globalThis.crypto?.randomUUID?.() || `session-${Date.now()}`;
    sessionStorage.setItem(STUDIO_SESSION_KEY, created);
    return created;
  } catch {
    return "";
  }
}

function scopedKey(base: string, accountId: string | null) {
  if (accountId) return `${base}:user:${accountId}`;
  const sessionId = studioSessionId();
  return sessionId ? `${base}:session:${sessionId}` : "";
}

function isStudioStorageKey(key: string) {
  return (
    key === STUDIO_DRAFT_KEY ||
    key === STUDIO_SAVED_KEY ||
    key.startsWith(`${STUDIO_DRAFT_KEY}:`) ||
    key.startsWith(`${STUDIO_SAVED_KEY}:`)
  );
}

export function hasPortfolioContent(portfolio: {
  milestones?: unknown[];
  summaryStatement?: string;
  highlights?: unknown[];
  portfolioAssets?: unknown[];
}) {
  const highlights = Array.isArray(portfolio.highlights)
    ? portfolio.highlights.some((line) => String(line || "").trim())
    : false;
  return Boolean(
    (Array.isArray(portfolio.milestones) && portfolio.milestones.length > 0) ||
      (portfolio.summaryStatement && portfolio.summaryStatement.trim().length > 0) ||
      highlights ||
      (Array.isArray(portfolio.portfolioAssets) && portfolio.portfolioAssets.length > 0)
  );
}

export function readStudioRecord<T>(key: string, accountId: string | null = boundAccountId): T | null {
  if (typeof window === "undefined") return null;
  try {
    const scoped = scopedKey(key, accountId);
    if (!scoped) return null;
    const raw = localStorage.getItem(scoped);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeStudioRecord(key: string, value: unknown, accountId: string | null = boundAccountId) {
  if (typeof window === "undefined") return;
  const scoped = scopedKey(key, accountId);
  if (!scoped) return;
  localStorage.setItem(scoped, JSON.stringify(value));
}

export function discardSessionStudioRecords() {
  if (typeof window === "undefined") return;
  const sessionId = studioSessionId();
  if (!sessionId) return;
  localStorage.removeItem(`${STUDIO_DRAFT_KEY}:session:${sessionId}`);
  localStorage.removeItem(`${STUDIO_SAVED_KEY}:session:${sessionId}`);
}

export function clearStudioPortfolioStorage() {
  if (typeof window === "undefined") return;
  const keys: string[] = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key && isStudioStorageKey(key)) keys.push(key);
  }
  keys.forEach((key) => localStorage.removeItem(key));
  try {
    sessionStorage.removeItem(STUDIO_SESSION_KEY);
  } catch {
    // Session storage can be unavailable in private browsing.
  }
  boundAccountId = null;
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
