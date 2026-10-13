import { describe, expect, it } from "vitest";
import { hydrateChapter, packChapter, readChapterExtras } from "./chapterMeta";

describe("chapter extras", () => {
  it("keeps a confirmed company site and chosen highlights on the chapter", () => {
    const packed = packChapter({
      company: "PairedRight",
      calibratedClaim: "Directed the product.",
      companyUrl: "https://www.pairedright.com/",
      highlightIndexes: [1]
    });
    expect(String(packed.calibratedClaim).startsWith("vcv-meta:")).toBe(true);
    const hydrated = hydrateChapter({
      claims: ["Kept the first line in the chapter only.", "Built the pairing flow for new members of the team."],
      calibratedClaim: packed.calibratedClaim
    });
    expect(hydrated.companyUrl).toBe("https://www.pairedright.com/");
    expect(hydrated.highlightIndexes).toEqual([1]);
    expect(hydrated.claims[1]).toBe("Built the pairing flow for new members of the team.");
    expect(readChapterExtras(hydrated.calibratedClaim).note).toBe("Directed the product.");
  });
});
