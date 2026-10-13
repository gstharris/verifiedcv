import { describe, expect, it } from "vitest";
import {
  companyProofLines,
  companyVerificationTooltip,
  corpEmailDomain,
  endorsedClaimIndexes,
  firstChapterWithoutColleague,
  postSavePrompt,
  publicTrustSummary
} from "./verificationSignals";

describe("verification signals", () => {
  it("extracts a corporate email domain", () => {
    expect(corpEmailDomain("graham@ge-on.com")).toBe("ge-on.com");
  });

  it("describes corporate email proof for hover copy", () => {
    expect(
      companyVerificationTooltip("Ge-on", [
        { name: "Corporate Email Verification", email: "graham@ge-on.com" }
      ])
    ).toBe("Work email @ge-on.com.");
    expect(companyVerificationTooltip("Ge-on", [])).toBe("");
    expect(
      companyProofLines("Ge-on", [
        { name: "Corporate Email Verification", email: "graham@ge-on.com" },
        { name: "Engineering Peer" }
      ], 1)
    ).toEqual(["Work email @ge-on.com", "1 colleague confirmation", "Employment document"]);
    expect(
      companyProofLines("Ge-on", [
        { name: "Corporate Email Verification", email: "graham@ge-on.com", role: "Mailbox directory + inbox code" }
      ])
    ).toEqual(["Work email @ge-on.com, checked against the company directory"]);
  });

  it("summarizes only the proof that exists", () => {
    expect(publicTrustSummary({})).toEqual([]);
    expect(
      publicTrustSummary({
        emailVerified: true,
        linkedinVerified: true,
        corroboratedChapters: 2,
        workSamples: 1
      })
    ).toEqual(["Identity confirmed: email, LinkedIn", "2 chapters corroborated", "1 work sample"]);
  });

  it("suggests the first chapter that has no colleague", () => {
    const chapters = [
      { company: "Yahoo", verifications: [{ name: "Senior Director" }] },
      { company: "Ge-on", verifications: [{ name: "Corporate Email Verification", email: "a@ge-on.com" }] },
      { company: "PairedRight", verifications: [] }
    ];
    expect(firstChapterWithoutColleague(chapters)?.company).toBe("Ge-on");
    expect(postSavePrompt("GHarris", "Ge-on")).toBe(
      "Your page is live at verifiedcv.app/gharris. Make one chapter more believable. Ask someone who worked with you at Ge-on."
    );
    expect(postSavePrompt("gharris", null)).toBe(
      "Your page is live at verifiedcv.app/gharris. You can ask a colleague whenever you are ready."
    );
  });

  it("maps claim ids like c0 to indexes", () => {
    expect(endorsedClaimIndexes(["c0", "c2", "c0", "skip"])).toEqual([0, 2]);
  });
});
