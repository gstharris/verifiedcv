import { afterEach, describe, expect, it } from "vitest";
import {
  STUDIO_DRAFT_KEY,
  STUDIO_SAVED_KEY,
  clearStudioPortfolioStorage,
  hasPortfolioContent,
  readStudioRecord,
  stripProofFromMilestones,
  unverifiedContact,
  writeStudioRecord
} from "./studioPortfolio";

const memory = new Map<string, string>();

const sessionStorageMock = {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => {
    memory.set(key, value);
  },
  removeItem: (key: string) => {
    memory.delete(key);
  }
};

describe("studio portfolio storage", () => {
  afterEach(() => {
    memory.clear();
  });

  it("treats milestones or a summary as real portfolio content", () => {
    expect(hasPortfolioContent({ milestones: [], summaryStatement: "" })).toBe(false);
    expect(hasPortfolioContent({ milestones: [{ id: "m1" }] })).toBe(true);
    expect(hasPortfolioContent({ summaryStatement: "Built a $400M platform." })).toBe(true);
  });

  it("round-trips draft and saved portfolio records", () => {
    Object.defineProperty(globalThis, "window", { value: {}, configurable: true });
    Object.defineProperty(globalThis, "sessionStorage", { value: sessionStorageMock, configurable: true });

    writeStudioRecord(STUDIO_DRAFT_KEY, { handle: "gharris", milestones: [{ id: "m1" }] });
    writeStudioRecord(STUDIO_SAVED_KEY, { handle: "gharris", saved: true });

    expect(readStudioRecord<{ handle: string }>(STUDIO_DRAFT_KEY)?.handle).toBe("gharris");
    expect(readStudioRecord<{ saved: boolean }>(STUDIO_SAVED_KEY)?.saved).toBe(true);

    clearStudioPortfolioStorage();
    expect(readStudioRecord(STUDIO_DRAFT_KEY)).toBeNull();
    expect(readStudioRecord(STUDIO_SAVED_KEY)).toBeNull();
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
