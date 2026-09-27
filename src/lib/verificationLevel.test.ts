import { describe, expect, it } from "vitest";
import { getVerificationStatus, previewVerificationStatus } from "./verificationLevel";

describe("company verification levels", () => {
  it("starts unverified with no proof", () => {
    expect(getVerificationStatus({ peers: 0, docs: 0, registry: false })).toEqual({
      level: 0,
      label: "Unverified"
    });
  });

  it("reaches partial with one peer or one document", () => {
    expect(getVerificationStatus({ peers: 1, docs: 0, registry: false }).label).toBe("Partially Verified");
    expect(getVerificationStatus({ peers: 0, docs: 1, registry: false }).label).toBe("Partially Verified");
  });

  it("reaches company verified with two peers or one peer plus a document", () => {
    expect(getVerificationStatus({ peers: 2, docs: 0, registry: false }).label).toBe("Company Verified");
    expect(getVerificationStatus({ peers: 1, docs: 1, registry: false }).label).toBe("Company Verified");
  });

  it("previews the next badge after each action", () => {
    const current = { peers: 0, docs: 0, registry: false };
    expect(previewVerificationStatus(current, { peers: 1 }).label).toBe("Partially Verified");
    expect(previewVerificationStatus(current, { docs: 1 }).label).toBe("Partially Verified");
    expect(previewVerificationStatus({ peers: 1, docs: 0, registry: false }, { docs: 1 }).label).toBe(
      "Company Verified"
    );
    expect(previewVerificationStatus(current, { registry: true }).label).toBe("Cryptographically Anchored");
  });
});
