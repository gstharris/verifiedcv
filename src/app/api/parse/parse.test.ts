import { describe, expect, it } from "vitest";
import type { ParsedDossierPayload } from "./parseResume";
import {
  EMPTY_PDF_MESSAGE,
  THIN_RESUME_MESSAGE,
  WORD_RESUME_MESSAGE,
  extractAtomicAchievements,
  isWordResumeFile,
  parseComprehensiveResume,
  resumeImportHasContent,
  resumeImportLog,
  resumeParseLog
} from "./parseResume";

const CANONICAL_RESUME = `
Graham Harris
Los Angeles, CA
gstharris@example.com
linkedin.com/in/gstharris

PROFESSIONAL SUMMARY
Product leader focused on forensic proof of career outcomes and AI platform delivery.

PROFESSIONAL EXPERIENCE
SCD Enterprises / PairedRight | Founder and Head of Product | May 2025 — Present | Remote
● Directed the paired-right operating system across sales, delivery, and product.
● Designed the trust-signal pipeline that converts raw tenure into verified claims.
●
•
-
Built the candidate vault so overlapping peer corroboration stays private until publish.

Yahoo | Head of Product Management | 2018 — Mar 2026 | Sunnyvale, CA
● Scaled advertising personalization from zero to four hundred million in revenue.
● Deployed latency SLAs across ranking, retrieval, and experimentation stacks.

CORE PROFICIENCIES
Product Strategy, AI Platforms, Organizational Design, Roadmapping

EDUCATION
University of Southern California | B.S. Computer Science | 2008
Bachelor of Science, College of Engineering
`.trim();

describe("parseComprehensiveResume", () => {
  it("preserves company names that contain slashes", () => {
    const parsed = parseComprehensiveResume(CANONICAL_RESUME);
    const companies = parsed.milestones.map((m) => m.company);

    expect(companies).toContain("SCD Enterprises / PairedRight");
    expect(companies.some((c) => c === "SCD Enterprises")).toBe(false);
    expect(companies.some((c) => /^SCD Enterprises\s*$/.test(c))).toBe(false);
  });

  it("preserves compound leadership role titles", () => {
    const parsed = parseComprehensiveResume(CANONICAL_RESUME);
    const pairedRight = parsed.milestones.find(
      (m) => m.company === "SCD Enterprises / PairedRight"
    );

    expect(pairedRight).toBeDefined();
    expect(pairedRight?.role).toBe("Founder and Head of Product");
    expect(pairedRight?.role).not.toMatch(/^Founder$/);
  });

  it("preserves tenure start months and Present continuity", () => {
    const parsed = parseComprehensiveResume(CANONICAL_RESUME);
    const pairedRight = parsed.milestones.find(
      (m) => m.company === "SCD Enterprises / PairedRight"
    );
    const yahoo = parsed.milestones.find((m) => m.company === "Yahoo");

    expect(pairedRight?.period).toBe("May 2025 — Present");
    expect(yahoo?.period).toBe("2018 — Mar 2026");
  });

  it("strips orphan bullet glyphs so claims are genuine sentences", () => {
    const parsed = parseComprehensiveResume(CANONICAL_RESUME);
    const pairedRight = parsed.milestones.find(
      (m) => m.company === "SCD Enterprises / PairedRight"
    );

    expect(pairedRight).toBeDefined();
    const claims = pairedRight?.claims ?? [];

    expect(claims.length).toBeGreaterThan(0);
    for (const claim of claims) {
      expect(claim).not.toMatch(/^[●•\-\*–—◦‣⁃·\s]+$/);
      expect(claim).not.toMatch(/[●•◦‣⁃]/);
      expect(claim.replace(/[^a-zA-Z]/g, "").length).toBeGreaterThanOrEqual(12);
    }

    expect(claims.some((c) => /Directed the paired.?right operating system/i.test(c))).toBe(
      true
    );
    expect(claims.some((c) => /Built the candidate vault/i.test(c))).toBe(true);
  });

  it("isolates education records from core proficiencies", () => {
    const parsed = parseComprehensiveResume(CANONICAL_RESUME);
    const skillsJoined = parsed.skills.join(" ").toLowerCase();
    const educationBlob = parsed.education
      .map((e) => `${e.institution} ${e.degree}`)
      .join(" ")
      .toLowerCase();

    expect(parsed.skills).toEqual(
      expect.arrayContaining(["Product Strategy", "AI Platforms", "Organizational Design", "Roadmapping"])
    );

    expect(skillsJoined).not.toMatch(/university of southern california/);
    expect(skillsJoined).not.toMatch(/b\.s\.\s*computer science/);
    expect(skillsJoined).not.toMatch(/bachelor of science/);
    expect(skillsJoined).not.toMatch(/college of engineering/);

    expect(educationBlob).toMatch(/university of southern california/);
    expect(educationBlob).toMatch(/b\.s\.\s*computer science|bachelor of science/);
    expect(parsed.education.length).toBeGreaterThan(0);
    expect(parsed.highlights).toEqual([]);
  });

  it("keeps a highlights section when the resume has one", () => {
    const withHighlights = `
Ada Preview
CAREER HIGHLIGHTS
● Took a product from founding through the first enterprise contracts.
● Scaled the same system across a later role at a public company.
PROFESSIONAL EXPERIENCE
PairedRight | Founder | May 2025 — Present
● Directed the pairing flow for new members of the team.
`.trim();
    const parsed = parseComprehensiveResume(withHighlights);
    expect(parsed.highlights).toEqual([
      "Took a product from founding through the first enterprise contracts.",
      "Scaled the same system across a later role at a public company."
    ]);
    expect(parsed.milestones.map((milestone) => milestone.company)).toEqual(["PairedRight"]);
  });

  it("routes degree tokens that leak into skills into education instead", () => {
    const leaked = `
Name
EXPERIENCE
Acme | Engineer | 2020 — 2021
● Designed production services for enterprise operators.
CORE PROFICIENCIES
Roadmapping, B.S. Computer Science, TypeScript
EDUCATION
Stanford University | M.S. Computer Science | 2019
`.trim();

    const parsed = parseComprehensiveResume(leaked);
    const skillsJoined = parsed.skills.join(" ").toLowerCase();

    expect(parsed.skills).toEqual(expect.arrayContaining(["Roadmapping", "TypeScript"]));
    expect(skillsJoined).not.toMatch(/b\.s\.\s*computer science/);
    expect(
      parsed.education.some((e) => /b\.s\. computer science/i.test(e.institution) || /b\.s\. computer science/i.test(e.degree))
    ).toBe(true);
    expect(
      parsed.education.some((e) => /stanford university/i.test(e.institution))
    ).toBe(true);
  });
});

describe("plain resume import", () => {
  const plainResume = `
Ada Lovelace
ada@example.com
(415) 555-0134
https://www.linkedin.com/in/ada-lovelace
San Francisco, CA

HIGHLIGHTS
● Built the first published algorithm for a general-purpose machine.

EXPERIENCE
Analytical Engines
Head of Computation
March 2018 - Present
● Designed the instruction sequence that kept the engine correct.

Babbage Works
Collaborator
2014 - 2018
● Delivered the difference engine notes for the laboratory team.

SKILLS
Mathematics, Algorithms, Scientific Writing
`.trim();

  it("reads contact, stacked jobs, skills, and highlights without pipe headers", () => {
    const parsed = parseComprehensiveResume(plainResume);
    expect(parsed.fullName).toBe("Ada Lovelace");
    expect(parsed.contact).toMatchObject({
      email: "ada@example.com",
      phone: "(415) 555-0134",
      linkedin: "linkedin.com/in/ada-lovelace",
      location: "San Francisco, CA"
    });
    expect(parsed.highlights[0]).toMatch(/Built the first published algorithm/i);
    expect(parsed.milestones.map((milestone) => [milestone.company, milestone.role])).toEqual([
      ["Analytical Engines", "Head of Computation"],
      ["Babbage Works", "Collaborator"]
    ]);
    expect(parsed.milestones[0]?.claims).toEqual(["Designed the instruction sequence that kept the engine correct."]);
    expect(parsed.milestones[1]?.period).toBe("2014 — 2018");
    expect(parsed.skills).toEqual(expect.arrayContaining(["Mathematics", "Algorithms", "Scientific Writing"]));
  });

  it("keeps production parse logs to counts and contact flags", () => {
    const parsed = parseComprehensiveResume(plainResume);
    const log = resumeParseLog(parsed);
    const serialized = JSON.stringify(log);
    expect(serialized).not.toMatch(/ada@example\.com|555-0134|ada-lovelace|San Francisco|Ada Lovelace/);
    expect(log).toMatchObject({
      event: "resume_parse",
      experienceCount: 2,
      achievementCount: 2,
      skillCount: 3,
      highlightCount: 1,
      hasEmail: true,
      hasPhone: true,
      hasLinkedIn: true,
      hasLocation: true
    });
    expect(log).not.toHaveProperty("contact");

    const applied = resumeImportLog("studio_upload", parsed);
    expect(JSON.stringify(applied)).not.toMatch(/ada@example\.com|555-0134|ada-lovelace|San Francisco/);
    expect(applied).toMatchObject({
      experienceCount: 2,
      hasEmail: true,
      hasPhone: true,
      hasLinkedIn: true,
      hasLocation: true
    });
  });

  it("includes contact values in development logs only", () => {
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    try {
      const parsed = parseComprehensiveResume(plainResume);
      const log = resumeParseLog(parsed);
      expect(log).toMatchObject({
        contact: {
          email: "ada@example.com",
          phone: "(415) 555-0134",
          linkedin: "linkedin.com/in/ada-lovelace",
          location: "San Francisco, CA"
        },
        fullName: "Ada Lovelace"
      });
    } finally {
      process.env.NODE_ENV = previous;
    }
  });

  it("reads a company and role that share a line with the dates", () => {
    const parsed = parseComprehensiveResume(`
Ada Lovelace
ada@example.com
EXPERIENCE
Acme Corp — Head of Product    Jan 2020 - Present
● Shipped the onboarding flow for new candidate accounts.
SKILLS Product Strategy, Roadmapping
`.trim());
    expect(parsed.milestones.map((milestone) => [milestone.company, milestone.role, milestone.period])).toEqual([
      ["Acme Corp", "Head of Product", "Jan 2020 — Present"]
    ]);
    expect(parsed.milestones[0]?.claims).toEqual(["Shipped the onboarding flow for new candidate accounts."]);
    expect(parsed.skills).toEqual(expect.arrayContaining(["Product Strategy", "Roadmapping"]));
  });

  it("keeps a wrapped bullet that ends with the word experience", () => {
    const parsed = parseComprehensiveResume(`
GRAHAM HARRIS
PROFESSIONAL HIGHLIGHTS
● Speed & Delivery: Overhauled development lifecycles at Ge-on through rapid prototyping and clear
documentation, cutting recurring meetings by 20% and lifting velocity by 10%.
PROFESSIONAL EXPERIENCE
FansAgency LLC | Principal Advisor (Client: AEG Worldwide) | 2016 to 2021 | Santa Monica, CA
● Advised executive leadership at AEG Worldwide on digital platform architecture, customer experience
design, and commercial monetization across live entertainment campaigns.
● Ran conversion optimization programs across high-volume digital marketing channels that delivered a
20% increase in online conversion rates and an 18% lift in merchandise revenue.
Yahoo Inc. | Senior Director, Global Product Management and Product Marketing | 2010 to 2016 | Santa Monica,
CA
● Conceived and launched the Creative Personalization Platform from concept to $400M in platform revenue.
EARLIER CAREER EXPERIENCE
● RiverOne | Product Manager, Supply Chain Management (SCM) | Automated workflow routing, partner
integration protocols, and real-time operational data exchange.
● SAP Consultant | Enterprise ERP Implementation | Configured finance, procurement, and inventory
integration modules for enterprise corporate clients.
EDUCATION AND CERTIFICATIONS
● B.S. Business Administration, Management Information Systems | California State University, Chico
● Certified Scrum Product Owner (CSPO) | Scrum Alliance
SKILLS
● Agentic AI & Systems Architecture: Dynamic Model Routing, Token Prioritization, 3 Patents
● GTM Operations & Workflow Design: Quote-to-Cash Automation, Human-in-the-Loop Controls
`.trim());

    const fans = parsed.milestones.find((milestone) => milestone.company === "FansAgency LLC");
    expect(fans?.claims[0]).toBe(
      "Advised executive leadership at AEG Worldwide on digital platform architecture, customer experience design, and commercial monetization across live entertainment campaigns."
    );
    expect(fans?.claims[1]).toBe(
      "Ran conversion optimization programs across high-volume digital marketing channels that delivered a 20% increase in online conversion rates and an 18% lift in merchandise revenue."
    );
    expect(parsed.highlights[0]).toMatch(/Ge-on/);
    expect(parsed.highlights[0]).toMatch(/20%/);

    const yahoo = parsed.milestones.find((milestone) => milestone.company === "Yahoo Inc.");
    expect(yahoo?.location).toBe("Santa Monica, CA");
    expect(yahoo?.claims.join(" ")).not.toMatch(/EARLIER CAREER|RiverOne|SAP Consultant/);

    const river = parsed.milestones.find((milestone) => milestone.company === "RiverOne");
    expect(river?.role).toBe("Product Manager, Supply Chain Management (SCM)");
    expect(river?.claims[0]).toMatch(/real-time operational data exchange/);

    expect(parsed.education).toEqual(expect.arrayContaining([
      expect.objectContaining({
        institution: "California State University, Chico",
        degree: "B.S. Business Administration, Management Information Systems"
      }),
      expect.objectContaining({
        institution: "Scrum Alliance",
        degree: "Certified Scrum Product Owner (CSPO)"
      })
    ]));
    expect(parsed.skills).toEqual(expect.arrayContaining([
      "Dynamic Model Routing",
      "Token Prioritization",
      "3 Patents",
      "Quote-to-Cash Automation",
      "Human-in-the-Loop Controls"
    ]));
    expect(parsed.skills).not.toContain("AND CERTIFICATIONS");
  });
});

describe("resume import gate", () => {
  it("accepts chapters, or a name with another resume section", () => {
    expect(resumeImportHasContent({ milestones: [{ company: "Yard" }] } as Partial<ParsedDossierPayload>)).toBe(true);
    expect(resumeImportHasContent({ fullName: "Ada Lovelace", skills: ["Mathematics"] })).toBe(true);
    expect(resumeImportHasContent({ fullName: "Ada Lovelace", summaryStatement: "Built engines." })).toBe(true);
    expect(resumeImportHasContent({ fullName: "Ada Lovelace", highlights: ["First algorithm"] })).toBe(true);
    expect(resumeImportHasContent({ fullName: "Ada Lovelace", education: [{ institution: "Home" }] } as Partial<ParsedDossierPayload>)).toBe(true);
  });

  it("rejects contact-only and name-only extracts", () => {
    expect(resumeImportHasContent({
      fullName: "",
      contact: { email: "ada@example.com", phone: "4155550134", linkedin: "linkedin.com/in/ada", location: "London" }
    })).toBe(false);
    expect(resumeImportHasContent({ fullName: "Ada Lovelace" })).toBe(false);
    expect(resumeImportHasContent({ skills: [" "] })).toBe(false);
    expect(resumeImportHasContent({})).toBe(false);
  });

  it("names Word files and the recovery messages without resume text", () => {
    expect(isWordResumeFile("resume.docx", "")).toBe(true);
    expect(isWordResumeFile("resume.DOC", "application/msword")).toBe(true);
    expect(isWordResumeFile("resume.pdf", "application/pdf")).toBe(false);
    expect(WORD_RESUME_MESSAGE).toMatch(/Paste the resume text, or upload a PDF/);
    expect(EMPTY_PDF_MESSAGE).toMatch(/no selectable text/i);
    expect(THIN_RESUME_MESSAGE).toMatch(/start from scratch/i);
    expect(`${WORD_RESUME_MESSAGE} ${EMPTY_PDF_MESSAGE} ${THIN_RESUME_MESSAGE}`).not.toMatch(/@|linkedin\.com\/in\//);
  });
});

describe("extractAtomicAchievements", () => {
  it("discards glyph-only lines and keeps action sentences", () => {
    const claims = extractAtomicAchievements([
      "●",
      "•",
      "-",
      "● Directed operational execution across product and engineering.",
      "Designed the verification workflow for overlapping tenures."
    ]);

    expect(claims.every((c) => !/^[●•\-\*–—◦‣⁃·\s]+$/.test(c))).toBe(true);
    expect(claims.some((c) => /Directed operational execution/i.test(c))).toBe(true);
    expect(claims.some((c) => /Designed the verification workflow/i.test(c))).toBe(true);
  });
});
