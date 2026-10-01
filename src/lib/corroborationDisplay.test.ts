import { describe, expect, it } from "vitest";
import { corroborationHeadline, publicTitleFromVerification } from "./corroborationDisplay";

describe("corroboration display", () => {
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

  it("rolls up many confirmations into a LinkedIn member count", () => {
    const seven = Array.from({ length: 7 }, (_, i) => ({ name: `Director ${i}` }));
    expect(corroborationHeadline("Yahoo", seven)).toBe(
      "Corroborated by 7 LinkedIn members who worked at Yahoo"
    );
  });
});
