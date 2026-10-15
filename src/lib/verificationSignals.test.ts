import { describe, expect, it } from "vitest";
import {
  chapterProofItems,
  companyProofLines,
  companyVerificationTooltip,
  corpEmailDomain,
  employmentDocumentLabel,
  endorsedClaimIndexes,
  firstChapterWithoutColleague,
  hasWorkEmailProof,
  mergeChapterProof,
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
    ).toEqual(["Email confirmed", "LinkedIn confirmed", "2 chapters corroborated", "1 work sample"]);
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

  it("lists work email, colleagues, and uploaded documents as completed proof", () => {
    expect(employmentDocumentLabel({ name: "Employment document", type: "W-2 / offer letter" })).toBe(
      "Employment document"
    );
    expect(employmentDocumentLabel({ name: "Employment contract", type: "contract" })).toBe("Employment contract");
    expect(
      chapterProofItems(
        [
          { id: "v1", name: "Corporate Email Verification", email: "graham.harris@ge-on.com" },
          { id: "v2", name: "Alex Rivera", role: "Manager" }
        ],
        [{ id: "art-1", name: "Employment document", type: "contract" }]
      )
    ).toEqual([
      { id: "v1", kind: "verification", label: "Work email graham.harris@ge-on.com" },
      { id: "v2", kind: "verification", label: "Alex Rivera · Manager" },
      { id: "art-1", kind: "document", label: "Employment contract" }
    ]);
    expect(hasWorkEmailProof([{ name: "Corporate Email Verification" }])).toBe(true);
    expect(hasWorkEmailProof([{ name: "Alex Rivera" }])).toBe(false);
  });

  it("keeps server proof that the open studio is missing, and skips proof the user removed", () => {
    const removed = new Set(["art-1"]);
    expect(
      mergeChapterProof([{ id: "v1" }], [{ id: "v1" }, { id: "art-1" }, { id: "art-2" }], removed).map((item) => item.id)
    ).toEqual(["v1", "art-2"]);
  });
});
