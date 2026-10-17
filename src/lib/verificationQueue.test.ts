import { describe, expect, it } from "vitest";
import { nextPortfolioVerificationStep, verificationStatusLine } from "./verificationQueue";

describe("portfolio verification queue", () => {
  it("asks for email before any company chapter", () => {
    const next = nextPortfolioVerificationStep({
      emailVerified: false,
      linkedinVerified: false,
      chapters: [{ id: "m1", company: "SCD Enterprises / PairedRight", level: 0 }]
    });
    expect(next.id).toBe("email");
  });

  it("asks for chapter proof after email while LinkedIn stays optional", () => {
    const next = nextPortfolioVerificationStep({
      emailVerified: true,
      linkedinVerified: false,
      chapters: [{ id: "m1", company: "Ge-on", level: 0 }]
    });
    expect(next.id).toBe("chapter");
    expect(next.company).toBe("Ge-on");
    expect(next.detail).toMatch(/work email, invite a colleague, or scan an employment document/i);
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

  it("summarizes what is confirmed and the next two checks", () => {
    expect(
      verificationStatusLine({
        emailVerified: true,
        phoneVerified: true,
        linkedinVerified: false,
        chapters: [
          { company: "Ge-on", level: 1 },
          { company: "SCD Enterprises / PairedRight", level: 0 }
        ]
      })
    ).toBe(
      "Email, phone, and work at Ge-on are confirmed. Verify your work at SCD Enterprises / PairedRight next. LinkedIn is optional."
    );
  });
});
