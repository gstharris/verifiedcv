import { describe, expect, it } from "vitest";
import { companySiteGuesses, faviconUrl, publicHttpsUrl, siteLabel } from "./companySite";

describe("company sites", () => {
  it("guesses the brand after a slash before the legal name", () => {
    const sites = companySiteGuesses("SCD Enterprises / PairedRight");
    expect(sites[0]).toBe("https://www.pairedright.com");
    expect(sites.some((site) => site.includes("scd.com"))).toBe(true);
  });

  it("keeps a hyphenated name as its own host", () => {
    expect(companySiteGuesses("Ge-on")).toContain("https://www.ge-on.com");
  });

  it("accepts a public company url and rejects local hosts", () => {
    expect(publicHttpsUrl("www.pairedright.com")).toBe("https://www.pairedright.com/");
    expect(publicHttpsUrl("http://127.0.0.1/admin")).toBe("");
    expect(siteLabel("https://www.pairedright.com/about")).toBe("pairedright.com");
    expect(faviconUrl("https://www.pairedright.com")).toContain("pairedright.com");
  });
});
