import { describe, expect, it } from "vitest";
import {
  companyProofLines,
  companyVerificationTooltip,
  corpEmailDomain,
  endorsedClaimIndexes
} from "./verificationSignals";

describe("verification signals", () => {
  it("extracts a corporate email domain", () => {
    expect(corpEmailDomain("graham@ge-on.com")).toBe("ge-on.com");
  });

  it("describes corporate email proof for hover copy", () => {
    expect(
      companyVerificationTooltip("Ge-on", [
        { name: "Corporate Email Verification", email: "graham@ge-on.com" }
      ])
    ).toBe("Verified via Corporate email @ge-on.com.");
    expect(
      companyProofLines("Ge-on", [
        { name: "Corporate Email Verification", email: "graham@ge-on.com" },
        { name: "Engineering Peer" }
      ], 1)
    ).toEqual(["Corporate email @ge-on.com", "1 colleague confirmation", "Employment document"]);
    expect(
      companyProofLines("Ge-on", [
        { name: "Corporate Email Verification", email: "graham@ge-on.com", role: "Mailbox directory + inbox code" }
      ])
    ).toEqual(["Corporate email @ge-on.com via directory + inbox code"]);
  });

  it("maps claim ids like c0 to indexes", () => {
    expect(endorsedClaimIndexes(["c0", "c2", "c0", "skip"])).toEqual([0, 2]);
  });
});
