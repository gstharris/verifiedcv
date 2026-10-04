import { describe, expect, it } from "vitest";
import { nextPortfolioVerificationStep } from "./verificationQueue";

describe("portfolio verification queue", () => {
  it("asks for email before any company chapter", () => {
    const next = nextPortfolioVerificationStep({
      emailVerified: false,
      linkedinVerified: false,
      chapters: [{ id: "m1", company: "SCD Enterprises / PairedRight", level: 0 }]
    });
    expect(next.id).toBe("email");
  });

  it("asks for LinkedIn after email", () => {
    const next = nextPortfolioVerificationStep({
      emailVerified: true,
      linkedinVerified: false,
      chapters: [{ id: "m1", company: "Ge-on", level: 0 }]
    });
    expect(next.id).toBe("linkedin");
  });

  it("then asks for the first unverified company", () => {
    const next = nextPortfolioVerificationStep({
      emailVerified: true,
      linkedinVerified: true,
      chapters: [
        { id: "m1", company: "Ge-on", level: 1 },
        { id: "m2", company: "SCD Enterprises / PairedRight", level: 0 }
      ]
    });
    expect(next.id).toBe("chapter");
    expect(next.company).toBe("SCD Enterprises / PairedRight");
  });

  it("asks for phone only after identity and chapters have proof", () => {
    const next = nextPortfolioVerificationStep({
      emailVerified: true,
      linkedinVerified: true,
      phoneVerified: false,
      chapters: [{ id: "m1", company: "Ge-on", level: 2 }]
    });
    expect(next.id).toBe("phone");
  });
});
