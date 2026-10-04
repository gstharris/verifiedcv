import { describe, expect, it } from "vitest";
import { corporateEmailMatchesCompany, isConsumerEmailDomain } from "./corporateEmail";
import { assessCorporateEmail } from "./corporateEmailServer";

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

  it("rejects a matching domain that has no mail servers", async () => {
    const result = await assessCorporateEmail("PairedRight", "graham@pairedright.com", {
      lookupMx: async () => false
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/mail servers/i);
  });

  it("rejects a mailbox the company directory cannot find", async () => {
    const result = await assessCorporateEmail("PairedRight", "graham@pairedright.com", {
      lookupMx: async () => true,
      mailboxStatus: "invalid"
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/does not appear to exist/i);
  });

  it("accepts a matching domain with mail servers and a valid mailbox", async () => {
    const result = await assessCorporateEmail("PairedRight", "graham@pairedright.com", {
      lookupMx: async () => true,
      mailboxStatus: "valid"
    });
    expect(result.ok).toBe(true);
  });
});
