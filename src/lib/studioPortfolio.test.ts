import { afterEach, describe, expect, it } from "vitest";
import {
  STUDIO_DRAFT_KEY,
  STUDIO_SAVED_KEY,
  bindStudioAccount,
  clearStudioPortfolioStorage,
  hasPortfolioContent,
  readStudioDraftRevision,
  readStudioRecord,
  stripProofFromMilestones,
  unverifiedContact,
  writeStudioDraftRevision,
  writeStudioRecord
} from "./studioPortfolio";

const memory = new Map<string, string>();
const sessionMemory = new Map<string, string>();

const localStorageMock = {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => {
    memory.set(key, value);
  },
  removeItem: (key: string) => {
    memory.delete(key);
  },
  key: (index: number) => [...memory.keys()][index] ?? null,
  get length() {
    return memory.size;
  }
};

const sessionStorageMock = {
  getItem: (key: string) => sessionMemory.get(key) ?? null,
  setItem: (key: string, value: string) => {
    sessionMemory.set(key, value);
  },
  removeItem: (key: string) => {
    sessionMemory.delete(key);
  }
};

describe("studio portfolio storage", () => {
  afterEach(() => {
    memory.clear();
    sessionMemory.clear();
    bindStudioAccount(null);
  });

  it("treats milestones or a summary as real portfolio content", () => {
    expect(hasPortfolioContent({ milestones: [], summaryStatement: "" })).toBe(false);
    expect(hasPortfolioContent({ milestones: [{ id: "m1" }] })).toBe(true);
    expect(hasPortfolioContent({ summaryStatement: "Built a $400M platform." })).toBe(true);
    expect(hasPortfolioContent({ portfolioAssets: [{ title: "Recipe film" }] })).toBe(true);
    expect(hasPortfolioContent({ highlights: ["A film about the tasting menu."] })).toBe(true);
  });

  it("round-trips draft and saved portfolio records", () => {
    Object.defineProperty(globalThis, "window", { value: {}, configurable: true });
    Object.defineProperty(globalThis, "localStorage", { value: localStorageMock, configurable: true });
    Object.defineProperty(globalThis, "sessionStorage", { value: sessionStorageMock, configurable: true });

    writeStudioRecord(STUDIO_DRAFT_KEY, { handle: "gharris", milestones: [{ id: "m1" }] });
    writeStudioRecord(STUDIO_SAVED_KEY, { handle: "gharris", saved: true });

    expect(readStudioRecord<{ handle: string }>(STUDIO_DRAFT_KEY)?.handle).toBe("gharris");
    expect(readStudioRecord<{ saved: boolean }>(STUDIO_SAVED_KEY)?.saved).toBe(true);

    clearStudioPortfolioStorage();
    expect(readStudioRecord(STUDIO_DRAFT_KEY)).toBeNull();
    expect(readStudioRecord(STUDIO_SAVED_KEY)).toBeNull();
  });

  it("keeps one account's draft off the next account and ignores an old shared key", () => {
    Object.defineProperty(globalThis, "window", { value: {}, configurable: true });
    Object.defineProperty(globalThis, "localStorage", { value: localStorageMock, configurable: true });
    Object.defineProperty(globalThis, "sessionStorage", { value: sessionStorageMock, configurable: true });

    localStorage.setItem(STUDIO_DRAFT_KEY, JSON.stringify({ handle: "old", fullName: "Previous Person" }));
    writeStudioRecord(STUDIO_DRAFT_KEY, { handle: "ada", fullName: "Ada Lovelace" }, "user-a");

    expect(readStudioRecord<{ fullName: string }>(STUDIO_DRAFT_KEY, "user-b")).toBeNull();
    expect(readStudioRecord<{ fullName: string }>(STUDIO_DRAFT_KEY, "user-a")?.fullName).toBe("Ada Lovelace");
    expect(JSON.parse(localStorage.getItem(STUDIO_DRAFT_KEY) || "{}").fullName).toBe("Previous Person");

    writeStudioDraftRevision(5, "user-a");
    expect(readStudioDraftRevision("user-a")).toBe(5);
    expect(readStudioDraftRevision("user-b")).toBe(0);

    clearStudioPortfolioStorage();
    expect(localStorage.getItem(STUDIO_DRAFT_KEY)).toBeNull();
    expect(readStudioRecord(STUDIO_DRAFT_KEY, "user-a")).toBeNull();
    expect(readStudioDraftRevision("user-a")).toBe(0);
  });

  it("clears verified flags and proof artifacts for a replay", () => {
    const contact = unverifiedContact({
      email: "graham@example.com",
      emailVerified: true,
      phoneVerified: true,
      linkedinVerified: true
    });
    expect(contact.emailVerified).toBe(false);
    expect(contact.phoneVerified).toBe(false);
    expect(contact.linkedinVerified).toBe(false);
    expect(
      stripProofFromMilestones([
        { id: "m1", artifacts: [{ id: "a1" }], verifications: [{ id: "v1" }] }
      ])
    ).toEqual([{ id: "m1", artifacts: [], verifications: [] }]);
  });
});
