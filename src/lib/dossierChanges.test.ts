import { describe, expect, it } from "vitest";
import { hydrateChapter, packChapter } from "./chapterMeta";
import { hasUnpublishedChanges, summarizeDossierChanges, type DossierSnapshot } from "./dossierChanges";

function chapter(id: string, company: string, claims: string[] = ["Shipped the onboarding flow for new teams."]) {
  return { id, company, role: "Product manager", period: "2020 — 2024", claims };
}

function summarize(published: DossierSnapshot, draft: DossierSnapshot) {
  return summarizeDossierChanges(published, draft).changes.map((change) => change.text);
}

describe("summarizeDossierChanges", () => {
  it("ignores proof, verification flags, and whitespace that does not change the text", () => {
    const published: DossierSnapshot = {
      summaryStatement: "  Built products.  ",
      fullName: "Graham Harris",
      preferredLayout: "traditional",
      contact: {
        email: "Graham@Example.com",
        phone: "+1 (415) 555-0100",
        linkedin: "https://www.linkedin.com/in/gharris",
        location: "Austin,  TX",
        emailVerified: false,
        phoneVerified: false,
        linkedinVerified: false
      },
      milestones: [
        {
          ...chapter("m1", "Acme"),
          verifications: [{ id: "v1", name: "Ada" }],
          artifacts: [{ id: "a1", name: "Offer letter" }]
        }
      ]
    };
    const draft: DossierSnapshot = {
      summaryStatement: "Built products.",
      fullName: "Graham Harris",
      preferredLayout: "summary:bottom",
      contact: {
        email: "graham@example.com",
        phone: "4155550100",
        linkedin: "gharris",
        location: "austin, tx",
        emailVerified: true,
        phoneVerified: true,
        linkedinVerified: true
      },
      milestones: [chapter("m1", "Acme")]
    };

    expect(summarize(published, draft)).toEqual([]);
    expect(hasUnpublishedChanges(published, draft)).toBe(false);
  });

  it("treats a packed chapter and its hydrated editor form as the same content", () => {
    const stored = packChapter({
      id: "m1",
      company: "Acme",
      role: "Product manager",
      period: "2020 — 2024",
      claims: ["Shipped the onboarding flow for new teams."],
      calibratedClaim: "Kept the private note.",
      companyUrl: "https://acme.example",
      highlightIndexes: [0]
    });
    const fromDatabase = {
      id: stored.id,
      company: stored.company,
      role: stored.role,
      period: stored.period,
      claims: stored.claims,
      calibratedClaim: stored.calibratedClaim
    };

    expect(hasUnpublishedChanges({ milestones: [fromDatabase] }, { milestones: [hydrateChapter(fromDatabase)] })).toBe(false);
  });

  it("describes summary, headline, and name edits", () => {
    expect(summarize({ summaryStatement: "Old summary." }, { summaryStatement: "New summary." })).toEqual(["Summary updated"]);
    expect(summarize({ summaryStatement: "Old summary." }, { summaryStatement: "" })).toEqual(["Summary removed"]);
    expect(summarize({ summaryStatement: "" }, { summaryStatement: "New summary." })).toEqual(["Summary added"]);
    expect(summarize({ headline: "PM" }, { headline: "Product leader" })).toEqual(["Headline updated"]);
    expect(summarize({ fullName: "Graham" }, { fullName: "Graham Harris" })).toEqual(["Name updated"]);
  });

  it("counts achievement edits on chapters that are still in the draft", () => {
    const published = {
      milestones: [
        chapter("m1", "Acme", ["Shipped the first onboarding flow.", "Cut review time for the team."]),
        chapter("m2", "Beta", ["Launched the billing rewrite for midmarket."])
      ]
    };
    const draft = {
      milestones: [
        chapter("m1", "Acme", ["Shipped the second onboarding flow.", "Cut review time for the team.", "Opened a new support queue."]),
        chapter("m2", "Beta", ["Launched the payments rewrite for midmarket."])
      ]
    };

    expect(summarize(published, draft)).toEqual(["2 achievements edited", "1 achievement added"]);
  });

  it("does not count claims on added or removed chapters as achievement edits", () => {
    const published = {
      milestones: [chapter("m1", "Acme", ["Shipped the onboarding flow.", "Hired the first researcher."])]
    };
    const draft = {
      milestones: [chapter("m2", "Beta", ["Opened the London office for the team.", "Hired the second researcher."])]
    };

    expect(summarize(published, draft)).toEqual(["1 chapter added", "1 chapter removed"]);
  });

  it("names the company when a role changes and warns when a removed chapter has proof", () => {
    const published = {
      milestones: [
        {
          ...chapter("m1", "Acme"),
          role: "Product manager",
          verifications: [{ id: "v1" }]
        },
        chapter("m2", "Beta", ["Kept this chapter in the draft."])
      ]
    };
    const draft = {
      milestones: [{ ...chapter("m1", "Acme"), role: "Head of product" }]
    };

    expect(summarize(published, draft)).toEqual([
      "1 chapter removed",
      "Role updated at Acme"
    ]);

    expect(
      summarize(
        { milestones: [{ ...chapter("m1", "Acme"), artifacts: [{ id: "a1" }] }] },
        { milestones: [] }
      )
    ).toEqual(["1 chapter removed. Proof on this chapter is removed when you publish."]);

    expect(
      summarize(
        {
          milestones: [
            { ...chapter("m1", "Acme"), registryLinks: [{ id: "r1" }] },
            { ...chapter("m2", "Beta"), endorsedClaimIds: ["c1"] },
            chapter("m3", "Gamma")
          ]
        },
        { milestones: [] }
      )
    ).toEqual(["3 chapters removed. Proof on 2 chapters is removed when you publish."]);

    expect(
      summarize(
        {
          milestones: [
            { ...chapter("m1", "Acme"), verifications: [{ id: "v1" }] },
            { ...chapter("m2", "Beta"), artifacts: [{ id: "a1" }] }
          ]
        },
        { milestones: [] }
      )
    ).toEqual(["2 chapters removed. Proof on these chapters is removed when you publish."]);
  });

  it("counts one removed achievement", () => {
    expect(
      summarize(
        { milestones: [chapter("m1", "Acme", ["First achievement for the team.", "Second achievement for the team."])] },
        { milestones: [chapter("m1", "Acme", ["First achievement for the team."])] }
      )
    ).toEqual(["1 achievement removed"]);
  });

  it("summarizes skills, education, sample work, and highlights", () => {
    const published: DossierSnapshot = {
      skills: ["Research", "Writing", "SQL"],
      education: [{ id: "e1", institution: "State", degree: "BA", year: "2014" }],
      portfolioAssets: [{ id: "p1", title: "Film", url: "https://example.com/a", verificationStatus: "link_checked" }],
      highlights: ["Led the launch across three cities."]
    };
    const draft: DossierSnapshot = {
      skills: ["Research", "Writing", "Python", "Excel"],
      education: [{ id: "e1", institution: "State", degree: "BS", year: "2014" }],
      portfolioAssets: [
        { id: "p1", title: "Film", url: "https://example.com/a", verificationStatus: "registry", verificationNote: "ignored" },
        { id: "p2", title: "Deck", url: "https://example.com/b" }
      ],
      highlights: []
    };

    expect(summarize(published, draft)).toEqual([
      "3 skills updated",
      "Education updated",
      "1 sample work item added",
      "Highlights removed"
    ]);
  });

  it("calls an order-only skill change an update without a count", () => {
    expect(summarize({ skills: ["Go", "Rust"] }, { skills: ["Rust", "Go"] })).toEqual(["Skills updated"]);
  });

  it("describes contact, layout, and company site edits", () => {
    expect(
      summarize(
        {
          contact: { email: "old@example.com", phone: "4155550100", linkedin: "gharris", location: "Austin" },
          preferredLayout: "summary:bottom",
          milestones: [{ ...chapter("m1", "Acme"), companyUrl: "https://acme.example" }]
        },
        {
          contact: { email: "new@example.com", phone: "2125550100", linkedin: "other", location: "Brooklyn" },
          preferredLayout: "summary:top",
          milestones: [{ ...chapter("m1", "Acme"), companyUrl: "https://acme.example/new" }]
        }
      )
    ).toEqual([
      "Company site updated at Acme",
      "Email updated",
      "Phone updated",
      "LinkedIn updated",
      "Location updated",
      "Layout updated"
    ]);
  });

  it("keeps the visible list to 12 lines and reports the rest", () => {
    const published = {
      milestones: Array.from({ length: 13 }, (_, index) => ({ ...chapter(`m${index}`, `Co ${index}`), role: "Old" }))
    };
    const draft = {
      milestones: Array.from({ length: 13 }, (_, index) => ({ ...chapter(`m${index}`, `Co ${index}`), role: "New" }))
    };
    const summary = summarizeDossierChanges(published, draft);

    expect(summary.changes).toHaveLength(12);
    expect(summary.changes[0].text).toBe("Role updated at Co 0");
    expect(summary.changes[11].text).toBe("Role updated at Co 11");
    expect(summary.overflow).toBe(1);
    expect(summary.overflowLabel).toBe("and 1 more edit");
    expect(summary.hasChanges).toBe(true);
  });
});
