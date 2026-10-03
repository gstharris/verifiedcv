import { describe, expect, it } from "vitest";
import {
  candidateNameInDocument,
  chapterYears,
  classifyEmploymentDocument,
  companyMentioned,
  matchEmploymentDocument
} from "./documentProof";

const W2_TEXT = `
Form W-2 Wage and Tax Statement 2012
Employee's name GRAHAM HARRIS
Employer Yahoo Inc.
Wages 120000
`;

describe("document proof matching", () => {
  it("treats slash-separated company names as either entity", () => {
    expect(companyMentioned("SCD Enterprises / PairedRight", "Offer letter from PairedRight")).toBe(true);
    expect(companyMentioned("Yahoo", "Google LLC paystub")).toBe(false);
  });

  it("expands chapter years across a tenure range", () => {
    expect(chapterYears("May 2010 — 2014")).toEqual([2010, 2011, 2012, 2013, 2014]);
  });

  it("requires last name of sufficient length", () => {
    expect(candidateNameInDocument("Graham Harris", W2_TEXT)).toBe(true);
    expect(candidateNameInDocument("Alex Rivera", W2_TEXT)).toBe(false);
  });

  it("accepts a W-2 that names the employer and an overlapping year", () => {
    const match = matchEmploymentDocument({
      text: W2_TEXT,
      company: "Yahoo",
      period: "May 2010 — 2014",
      candidateName: "Graham Harris"
    });
    expect(match.ok).toBe(true);
    expect(match.companyMatched).toBe(true);
    expect(match.yearMatched).toBe(true);
  });

  it("rejects a file that never names the employer", () => {
    const match = matchEmploymentDocument({
      text: W2_TEXT,
      company: "Google",
      period: "2010 — 2014",
      candidateName: "Graham Harris"
    });
    expect(match.ok).toBe(false);
    expect(match.companyMatched).toBe(false);
  });

  it("rejects employer-only documents without name or overlapping year", () => {
    const match = matchEmploymentDocument({
      text: "Welcome to Yahoo. This is a public press kit from 1998.",
      company: "Yahoo",
      period: "2010 — 2014",
      candidateName: "Alex Rivera"
    });
    expect(match.ok).toBe(false);
    expect(match.companyMatched).toBe(true);
  });

  it("accepts Groq-extracted employer when the raw text is messy", () => {
    const match = matchEmploymentDocument({
      text: "Form W-2 Wage and Tax Statement Tax year 2012 GRAHAM HARRIS",
      company: "Yahoo",
      period: "2010 — 2014",
      candidateName: "Graham Harris",
      extractedEmployer: "Yahoo Inc."
    });
    expect(match.ok).toBe(true);
    expect(match.companyMatched).toBe(true);
    expect(match.documentClass).toBe("w2");
  });

  it("rejects a homemade PDF that only drops in a name and company", () => {
    const match = matchEmploymentDocument({
      text: "Graham Harris worked at Yahoo in 2012. This is my proof.",
      company: "Yahoo",
      period: "2010 — 2014",
      candidateName: "Graham Harris"
    });
    expect(match.ok).toBe(false);
    expect(classifyEmploymentDocument(match.reason ? "Graham Harris worked at Yahoo in 2012." : "")).toBeNull();
    expect(match.documentClass).toBeNull();
  });
});
