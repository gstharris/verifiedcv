import { describe, expect, it } from "vitest";
import { blankChapter, companiesMatch, formatTenureFields, overlapCaption, overlapMonths, parseTenureFields, parseTenureRange, sortChaptersByTenure } from "./tenureOverlap";

describe("tenure overlap", () => {
  it("parses month-year ranges including Present", () => {
    expect(parseTenureRange("May 2010 — 2024")).toEqual({
      start: { year: 2010, month: 5 },
      end: { year: 2024, month: 12 }
    });
  });

  it("requires overlapping months at the same company", () => {
    const overlap = overlapMonths("2010 — 2024", "2012 — 2018");
    expect(overlap.ok).toBe(true);
    expect(overlap.months).toBeGreaterThan(0);
    expect(overlapMonths("2010 — 2012", "2018 — 2020").ok).toBe(false);
    expect(companiesMatch("Yahoo Inc.", "yahoo")).toBe(true);
    expect(companiesMatch("Yahoo", "Google")).toBe(false);
    expect(overlapCaption("2012 — 2018", 72)).toBe("Overlapped 2012 — 2018 · 72 months (stated)");
  });

  it("orders chapters with the most recent tenure first", () => {
    expect(
      sortChaptersByTenure([
        { company: "Old", period: "2010 — 2014" },
        { company: "Now", period: "May 2025 — Present" },
        { company: "Mid", period: "2018 — Mar 2020" },
        { company: "Newer current", period: "Jan 2026 — Present" }
      ]).map((chapter) => chapter.company)
    ).toEqual(["Newer current", "Now", "Mid", "Old"]);
  });

  it("keeps months optional and drops a blank chapter", () => {
    expect(parseTenureFields("May 2025 — Present")).toEqual({
      startMonth: "May",
      startYear: "2025",
      endMonth: "",
      endYear: "",
      present: true
    });
    expect(parseTenureFields("2018 — Mar 2026")).toMatchObject({
      startMonth: "",
      startYear: "2018",
      endMonth: "Mar",
      endYear: "2026",
      present: false
    });
    expect(formatTenureFields({
      startMonth: "",
      startYear: "2018",
      endMonth: "Mar",
      endYear: "2026",
      present: false
    })).toBe("2018 — Mar 2026");
    expect(blankChapter({ company: "", role: "", period: "", claims: ["", "  "] }).hasContent).toBe(false);
    expect(blankChapter({ company: "Ge-on", claims: [""] }).hasContent).toBe(true);
  });
});
