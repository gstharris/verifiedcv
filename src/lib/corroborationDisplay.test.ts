import { describe, expect, it } from "vitest";
import { colleagueInvitePitch, corroborationHeadline, publicTitleFromVerification } from "./corroborationDisplay";

describe("corroboration display", () => {
  it("invites the colleague to start their own page from the same company", () => {
    expect(colleagueInvitePitch("Graham Harris", "Yahoo")).toEqual({
      ask: "Graham Harris wants you to confirm you worked together at Yahoo.",
      loop: "That request is Graham saying you were there too. Create your portfolio, and Yahoo can be the first chapter on it."
    });
  });

  it("hides the name and keeps title plus company for one person", () => {
    expect(
      publicTitleFromVerification({
        name: "Former Senior Director @ Yahoo",
        role: "Overlapped 2012 — 2018 · 84 months (stated)"
      })
    ).toBe("Senior Director");
    expect(
      corroborationHeadline("Yahoo", [{ name: "Senior Director of Core Engineering" }])
    ).toBe("Confirmed by a Senior Director of Core Engineering at Yahoo");
  });

  it("names a work email without calling it verified", () => {
    expect(
      corroborationHeadline("Ge-on", [{ name: "Corporate Email Verification" }])
    ).toBe("Work email confirmed at Ge-on");
    expect(
      corroborationHeadline("Ge-on", [
        { name: "Corporate Email Verification" },
        { name: "Engineering Manager" }
      ])
    ).toBe("Work email and 1 colleague at Ge-on");
  });

  it("rolls up many confirmations into a LinkedIn member count", () => {
    const seven = Array.from({ length: 7 }, (_, i) => ({ name: `Director ${i}` }));
    expect(corroborationHeadline("Yahoo", seven)).toBe(
      "Corroborated by 7 LinkedIn members who worked at Yahoo"
    );
  });
});
