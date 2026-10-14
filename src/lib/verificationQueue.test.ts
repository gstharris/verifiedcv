import { describe, expect, it } from "vitest";
import { nextPortfolioVerificationStep, recommendedAllyAction, verificationStatusLine } from "./verificationQueue";

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

  it("keeps one Ally action until verification and a colleague confirmation are both done", () => {
    const done = {
      id: "done" as const,
      title: "Portfolio verification is in good shape",
      detail: "Identity is confirmed and every chapter has proof."
    };

    expect(recommendedAllyAction({
      saved: false,
      hasContent: false,
      nextStep: done,
      colleagueConfirmed: false
    })).toEqual({ id: "upload_resume", label: "Upload a resume", action: "upload_resume" });

    expect(recommendedAllyAction({
      saved: false,
      hasContent: true,
      nextStep: done,
      colleagueConfirmed: false
    })).toEqual({ id: "save_portfolio", label: "Save and publish", action: "save_portfolio" });

    expect(recommendedAllyAction({
      saved: true,
      hasContent: true,
      nextStep: { id: "email", title: "Verify your email", detail: "Confirm the inbox on this profile." },
      colleagueConfirmed: false
    })).toEqual({ id: "email", label: "Verify your email", action: "continue_verification" });

    expect(recommendedAllyAction({
      saved: true,
      hasContent: true,
      nextStep: done,
      colleagueConfirmed: false
    })).toEqual({ id: "ask_colleague", label: "Ask a colleague", action: "ask_colleague" });

    expect(recommendedAllyAction({
      saved: true,
      hasContent: true,
      nextStep: done,
      colleagueConfirmed: true
    })).toBeNull();
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
      "Email, phone, and work at Ge-on are confirmed. Verify LinkedIn, or your work at SCD Enterprises / PairedRight, next."
    );
  });
});
