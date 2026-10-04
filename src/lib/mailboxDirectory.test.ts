import { afterEach, describe, expect, it, vi } from "vitest";
import { decideMailboxDirectory, directoryOrganizationMatches, lookupMailboxDirectory } from "./mailboxDirectory";

describe("directory organization matching", () => {
  it("matches slash-delimited companies to the Hunter organization name", () => {
    expect(directoryOrganizationMatches("SCD Enterprises / PairedRight", "PairedRight Inc")).toBe(true);
    expect(directoryOrganizationMatches("PairedRight", "Google")).toBe(false);
    expect(directoryOrganizationMatches("PairedRight", "")).toBeNull();
  });
});

describe("mailbox directory decisions", () => {
  it("fails closed in production when no API key is configured", () => {
    const report = decideMailboxDirectory({
      company: "PairedRight",
      email: "graham@pairedright.com",
      configured: false,
      requireDirectory: true
    });
    expect(report.status).toBe("invalid");
    expect(report.summary).toMatch(/not configured/i);
  });

  it("skips locally when no API key is configured", () => {
    const report = decideMailboxDirectory({
      company: "PairedRight",
      email: "graham@pairedright.com",
      configured: false,
      requireDirectory: false
    });
    expect(report.status).toBe("skipped");
  });

  it("rejects disposable, webmail, gibberish, and invalid mailboxes", () => {
    expect(
      decideMailboxDirectory({
        company: "PairedRight",
        email: "a@pairedright.com",
        configured: true,
        requireDirectory: true,
        verifier: { status: "disposable", disposable: true }
      }).status
    ).toBe("invalid");
    expect(
      decideMailboxDirectory({
        company: "PairedRight",
        email: "a@pairedright.com",
        configured: true,
        requireDirectory: true,
        verifier: { status: "webmail", webmail: true }
      }).status
    ).toBe("invalid");
    expect(
      decideMailboxDirectory({
        company: "PairedRight",
        email: "e65rc109q@pairedright.com",
        configured: true,
        requireDirectory: true,
        verifier: { status: "valid", gibberish: true, score: 90 }
      }).status
    ).toBe("invalid");
    expect(
      decideMailboxDirectory({
        company: "PairedRight",
        email: "nobody@pairedright.com",
        configured: true,
        requireDirectory: true,
        verifier: { status: "invalid" }
      }).summary
    ).toMatch(/does not appear to exist/i);
  });

  it("rejects a domain Hunter says belongs to a different company", () => {
    const report = decideMailboxDirectory({
      company: "PairedRight",
      email: "graham@pairedright.com",
      configured: true,
      requireDirectory: true,
      verifier: { status: "valid", score: 91, mx_records: true, smtp_check: true },
      organization: "Google"
    });
    expect(report.status).toBe("invalid");
    expect(report.summary).toMatch(/does not match PairedRight/i);
  });

  it("rejects a valid-looking mailbox that SMTP bounced", () => {
    const report = decideMailboxDirectory({
      company: "PairedRight",
      email: "graham@pairedright.com",
      configured: true,
      requireDirectory: true,
      verifier: { status: "valid", score: 80, mx_records: true, smtp_check: false, accept_all: false, block: false }
    });
    expect(report.status).toBe("invalid");
    expect(report.summary).toMatch(/rejected by the company mail server/i);
  });

  it("accepts a confirmed mailbox and notes a public directory sighting", () => {
    const report = decideMailboxDirectory({
      company: "SCD Enterprises / PairedRight",
      email: "graham@pairedright.com",
      configured: true,
      requireDirectory: true,
      verifier: { status: "valid", score: 96, mx_records: true, smtp_check: true, sources: [{ domain: "pairedright.com" }] },
      organization: "PairedRight",
      directoryEmails: ["graham@pairedright.com"]
    });
    expect(report.status).toBe("valid");
    expect(report.listedInDirectory).toBe(true);
    expect(report.summary).toMatch(/Public company directory/i);
  });

  it("allows catch-all company domains because the inbox code is the proof", () => {
    const report = decideMailboxDirectory({
      company: "PairedRight",
      email: "graham@pairedright.com",
      configured: true,
      requireDirectory: true,
      verifier: { status: "accept_all", accept_all: true, mx_records: true, score: 30 }
    });
    expect(report.status).toBe("accept_all");
  });
});

describe("Hunter lookup wrapper", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.HUNTER_API_KEY;
    delete process.env.VERIFIEDCV_REQUIRE_HUNTER;
  });

  it("skips when no directory key is configured", async () => {
    delete process.env.HUNTER_API_KEY;
    delete process.env.VERIFIEDCV_REQUIRE_HUNTER;
    const report = await lookupMailboxDirectory("graham@pairedright.com", "PairedRight");
    expect(report.status).toBe("skipped");
  });

  it("maps Hunter invalid results to a missing mailbox", async () => {
    process.env.HUNTER_API_KEY = "test-key";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: { status: "invalid" } })
      })
    );
    const report = await lookupMailboxDirectory("nobody@pairedright.com", "PairedRight");
    expect(report.status).toBe("invalid");
  });
});
