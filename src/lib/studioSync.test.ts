import { describe, expect, it } from "vitest";
import { mergePeerVerifications, mergeReplacedContact, overlayChapterProof, withIdentity } from "./studioSync";

describe("mergePeerVerifications", () => {
  it("copies verifications onto the matching chapter and leaves its text alone", () => {
    const editor = [
      {
        id: "m1",
        company: "Draft Co",
        role: "Founder and Head of Product",
        claims: ["Shipped the draft wording for this chapter"],
        verifications: [{ id: "v-old" }]
      },
      { id: "m2", company: "Untouched", claims: ["No peer on this chapter yet"], verifications: [] }
    ];
    const live = [
      { id: "m1", company: "Live Co", role: "Old role", claims: ["Live claim that must not replace the draft"], verifications: [{ id: "v-new" }] },
      { id: "m3", company: "Missing from editor", verifications: [{ id: "v-other" }] }
    ];

    const merged = mergePeerVerifications(editor, live);

    expect(merged[0]).toMatchObject({
      company: "Draft Co",
      role: "Founder and Head of Product",
      claims: ["Shipped the draft wording for this chapter"],
      verifications: [{ id: "v-new" }]
    });
    expect(merged[1]).toEqual(editor[1]);
    expect(merged).toHaveLength(2);
  });
});

describe("overlayChapterProof", () => {
  it("copies proof onto the published chapter without copying draft wording", () => {
    const published = [
      {
        id: "m1",
        company: "Live Co",
        claims: ["Published claim"],
        verifications: [{ id: "v1" }],
        artifacts: [{ id: "a1" }]
      }
    ];
    const editor = [
      {
        id: "m1",
        company: "Draft Co",
        claims: ["Draft claim that stays off the live page"],
        verifications: [{ id: "v1" }, { id: "v2" }],
        artifacts: []
      }
    ];

    expect(overlayChapterProof(published, editor)).toEqual([
      {
        id: "m1",
        company: "Live Co",
        claims: ["Published claim"],
        verifications: [{ id: "v1" }, { id: "v2" }],
        artifacts: []
      }
    ]);
  });
});

describe("withIdentity", () => {
  it("patches contact fields and leaves the rest of the record in place", () => {
    const record = {
      handle: "graham",
      summaryStatement: "Draft summary",
      email: "old@example.com",
      contact: { email: "old@example.com", phone: "555", emailVerified: false }
    };

    expect(withIdentity(record, { email: "new@example.com", emailVerified: true }, "sub-1")).toEqual({
      handle: "graham",
      summaryStatement: "Draft summary",
      email: "new@example.com",
      linkedinSub: "sub-1",
      contact: { email: "new@example.com", phone: "555", emailVerified: true }
    });
  });
});

describe("mergeReplacedContact", () => {
  const current = {
    email: "graham@example.com",
    phone: "",
    linkedin: "https://www.linkedin.com/in/gharris",
    location: "Austin",
    emailVerified: true,
    phoneVerified: false,
    linkedinVerified: false
  };

  it("fills only empty unverified fields and keeps verified flags", () => {
    expect(
      mergeReplacedContact(current, {
        email: "other@example.com",
        phone: "4155550100",
        linkedin: "https://www.linkedin.com/in/other",
        location: "Dallas"
      })
    ).toEqual({
      ...current,
      phone: "4155550100"
    });
  });
});
