import { describe, expect, it } from "vitest";
import { corporateEmailMatchesCompany, isConsumerEmailDomain } from "./corporateEmail";

describe("corporate email domain matching", () => {
  it("rejects personal inboxes even if the company name is famous", () => {
    expect(isConsumerEmailDomain("gmail.com")).toBe(true);
    expect(corporateEmailMatchesCompany("Google", "gstharris@gmail.com").ok).toBe(false);
    expect(corporateEmailMatchesCompany("Google", "gstharris@gmail.com").reason).toMatch(/personal inbox/i);
  });

  it("accepts a domain that shares the company name", () => {
    expect(corporateEmailMatchesCompany("Ge-on", "graham@ge-on.com").ok).toBe(true);
    expect(corporateEmailMatchesCompany("SCD Enterprises / PairedRight", "graham@pairedright.com").ok).toBe(true);
    expect(corporateEmailMatchesCompany("Google", "graham@google.com").ok).toBe(true);
  });

  it("rejects a work-looking inbox that does not match the employer", () => {
    const result = corporateEmailMatchesCompany("Google", "graham@acme-consulting.com");
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/does not match Google/i);
  });
});
