import { describe, expect, it } from "vitest";
import {
  extractAtomicAchievements,
  parseComprehensiveResume
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
