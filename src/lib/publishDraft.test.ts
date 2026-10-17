import { describe, expect, it } from "vitest";
import { publishDraft } from "./publishDraft";
import type { DossierSnapshot } from "./dossierChanges";

function liveChapter() {
  return {
    id: "m1",
    company: "Acme",
    role: "Product manager",
    period: "2020 — 2024",
    claims: ["Shipped the onboarding flow for new teams."],
    verifications: [{ id: "v1", name: "Live peer", verifiedAt: "2026-02-01" }],
    artifacts: [{ id: "a1", name: "Offer letter" }],
    registryLinks: [{ id: "r1", label: "Patent", url: "https://patents.example/1" }],
    endorsedClaimIds: ["claim-1"]
  };
}

describe("publishDraft", () => {
  it("keeps live proof on a surviving chapter when the draft copy is empty or stale", () => {
    const live: DossierSnapshot = {
      summaryStatement: "Live summary",
      contact: { email: "graham@example.com", emailVerified: true, phone: "4155550100", phoneVerified: true, linkedin: "gharris", linkedinVerified: true },
      milestones: [liveChapter()],
      linkedinSub: "live-sub"
    };
    const draft: DossierSnapshot = {
      summaryStatement: "Draft summary",
      contact: {
        email: "graham@example.com",
        emailVerified: false,
        phone: "+1 (415) 555-0100",
        phoneVerified: false,
        linkedin: "https://www.linkedin.com/in/gharris",
        linkedinVerified: false
      },
      milestones: [
        {
          id: "m1",
          company: "Acme",
          role: "Head of product",
          period: "2020 — 2024",
          claims: ["Rewrote the onboarding flow for new teams."],
          verifications: [{ id: "v1", name: "Stale peer", verifiedAt: "2026-01-01" }, { id: "v2", name: "Draft only" }],
          artifacts: [],
          registryLinks: []
        }
      ]
    };

    const published = publishDraft(live, draft);
    const chapter = published.milestones?.[0];

    expect(published.summaryStatement).toBe("Draft summary");
    expect(chapter?.role).toBe("Head of product");
    expect(chapter?.claims).toEqual(["Rewrote the onboarding flow for new teams."]);
    expect(chapter?.verifications).toEqual([
      { id: "v1", name: "Live peer", verifiedAt: "2026-02-01" },
      { id: "v2", name: "Draft only" }
    ]);
    expect(chapter?.artifacts).toEqual([{ id: "a1", name: "Offer letter" }]);
    expect(chapter?.registryLinks).toEqual([{ id: "r1", label: "Patent", url: "https://patents.example/1" }]);
    expect(chapter?.endorsedClaimIds).toEqual(["claim-1"]);
    expect(published.contact).toMatchObject({
      emailVerified: true,
      phoneVerified: true,
      linkedinVerified: true
    });
    expect(published.linkedinSub).toBe("live-sub");
  });

  it("keeps the live handle, name, and blank contact fields when the draft omitted them", () => {
    const published = publishDraft(
      {
        handle: "gharris",
        fullName: "Graham Harris",
        contact: { email: "graham@example.com", emailVerified: true, linkedin: "gharris", linkedinVerified: true, location: "Austin" }
      },
      {
        handle: "",
        fullName: "",
        summaryStatement: "Pasted summary",
        contact: { email: "graham@example.com", emailVerified: false, linkedin: "", location: "" }
      }
    );

    expect(published.handle).toBe("gharris");
    expect(published.fullName).toBe("Graham Harris");
    expect(published.contact).toMatchObject({
      email: "graham@example.com",
      emailVerified: true,
      linkedin: "gharris",
      linkedinVerified: true,
      location: "Austin"
    });
  });

  it("drops a verification flag when that contact value changed", () => {
    const live: DossierSnapshot = {
      contact: {
        email: "old@example.com",
        emailVerified: true,
        phone: "4155550100",
        phoneVerified: true,
        linkedin: "gharris",
        linkedinVerified: true
      }
    };
    const draft: DossierSnapshot = {
      contact: {
        email: "new@example.com",
        emailVerified: true,
        phone: "2125550199",
        phoneVerified: true,
        linkedin: "someone-else",
        linkedinVerified: true
      }
    };

    expect(publishDraft(live, draft).contact).toMatchObject({
      email: "new@example.com",
      emailVerified: false,
      phone: "2125550199",
      phoneVerified: false,
      linkedin: "someone-else",
      linkedinVerified: false
    });
    expect(publishDraft(live, draft).email).toBe("new@example.com");
  });

  it("does not let a draft flag verify a contact value the live dossier has not verified", () => {
    const published = publishDraft(
      { contact: { email: "graham@example.com", emailVerified: false } },
      { contact: { email: "Graham@Example.com", emailVerified: true } }
    );

    expect(published.contact?.emailVerified).toBe(false);
  });

  it("omits chapters the draft removed and leaves their proof off the payload", () => {
    const published = publishDraft(
      {
        milestones: [
          liveChapter(),
          { id: "m2", company: "Beta", role: "Advisor", claims: ["Advised the seed round for a year."], verifications: [{ id: "v9" }] }
        ]
      },
      {
        milestones: [{ id: "m1", company: "Acme", role: "Product manager", claims: ["Shipped the onboarding flow for new teams."] }]
      }
    );

    expect(published.milestones?.map((milestone) => milestone.id)).toEqual(["m1"]);
    expect(published.milestones?.[0].verifications).toEqual([{ id: "v1", name: "Live peer", verifiedAt: "2026-02-01" }]);
  });

  it("keeps the draft linkedin subject when the draft already has one", () => {
    expect(publishDraft({ linkedinSub: "live-sub" }, { linkedinSub: "draft-sub" }).linkedinSub).toBe("draft-sub");
  });

  it("does not mutate either input", () => {
    const live: DossierSnapshot = {
      contact: { email: "graham@example.com", emailVerified: true },
      milestones: [liveChapter()]
    };
    const draft: DossierSnapshot = {
      summaryStatement: "Draft",
      contact: { email: "graham@example.com", emailVerified: false },
      milestones: [{ id: "m1", company: "Acme", role: "Head of product", claims: ["Rewrote the onboarding flow."], verifications: [] }]
    };
    const liveJson = JSON.stringify(live);
    const draftJson = JSON.stringify(draft);

    const published = publishDraft(live, draft);
    published.summaryStatement = "Changed after publish";
    published.milestones?.[0].verifications?.push({ id: "extra" });

    expect(JSON.stringify(live)).toBe(liveJson);
    expect(JSON.stringify(draft)).toBe(draftJson);
    expect(published.milestones?.[0].verifications).not.toBe(live.milestones?.[0].verifications);
  });
});
