import { describe, expect, it } from "vitest";
import { companyPhraseFromRequest, interpretVerificationAsk } from "./chapterMatch";

const chapters = [
  { id: "fans", company: "Fans Agency" },
  { id: "scd", company: "SCD Enterprises / PairedRight" },
  { id: "geon", company: "Ge-on" }
];

describe("chapter matching from chat", () => {
  it("pulls the company out of a verification request", () => {
    expect(companyPhraseFromRequest("I want to verify Fans Agenciy")).toBe("Fans Agenciy");
    expect(companyPhraseFromRequest("start validation for Geon")).toBe("Geon");
    expect(companyPhraseFromRequest("verify my portfolio")).toBeNull();
    expect(companyPhraseFromRequest("hello")).toBeNull();
  });

  it("matches a misspelled company instead of the next chapter in line", () => {
    const asked = interpretVerificationAsk("I want to verify Fans Agenciy", chapters);
    expect(asked.status).toBe("match");
    if (asked.status === "match") expect(asked.chapter.company).toBe("Fans Agency");
  });

  it("matches a short name and either side of a slash", () => {
    expect(interpretVerificationAsk("verify SCD", chapters)).toMatchObject({
      status: "match",
      chapter: { company: "SCD Enterprises / PairedRight" }
    });
    expect(interpretVerificationAsk("validate Paired Right", chapters)).toMatchObject({
      status: "match",
      chapter: { company: "SCD Enterprises / PairedRight" }
    });
    expect(interpretVerificationAsk("confirm Geon", chapters)).toMatchObject({
      status: "match",
      chapter: { company: "Ge-on" }
    });
  });

  it("does not invent a chapter when the name is not on the resume", () => {
    expect(interpretVerificationAsk("verify Yahoo", chapters)).toEqual({ status: "missing", phrase: "Yahoo" });
  });

  it("keeps a bare verify request on the queue", () => {
    expect(interpretVerificationAsk("verify", chapters).status).toBe("next");
    expect(interpretVerificationAsk("verify my portfolio", chapters).status).toBe("next");
    expect(interpretVerificationAsk("confirm my email", chapters)).toEqual({ status: "identity", field: "email" });
    expect(interpretVerificationAsk("what is next", chapters).status).toBe("unrelated");
  });

  it("asks which chapter when two names are equally close", () => {
    const asked = interpretVerificationAsk("verify agency", [
      { company: "Fans Agency" },
      { company: "Talent Agency" }
    ]);
    expect(asked.status).toBe("ambiguous");
    if (asked.status === "ambiguous") {
      expect(asked.chapters.map((chapter) => chapter.company)).toEqual(["Fans Agency", "Talent Agency"]);
    }
  });
});
