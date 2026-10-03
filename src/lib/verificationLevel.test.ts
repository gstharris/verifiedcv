import { describe, expect, it } from "vitest";
import { getVerificationStatus, previewVerificationStatus } from "./verificationLevel";

describe("company verification levels", () => {
  it("starts self-attested with no proof", () => {
    expect(getVerificationStatus({ peers: 0, docs: 0, registry: false })).toEqual({
      level: 0,
      label: "Self-Attested"
    });
  });

  it("reaches verified with one peer or one document", () => {
    expect(getVerificationStatus({ peers: 1, docs: 0, registry: false }).label).toBe("Verified");
    expect(getVerificationStatus({ peers: 0, docs: 1, registry: false }).label).toBe("Verified");
  });

  it("reaches verified+ with two peers or one peer plus a document", () => {
    expect(getVerificationStatus({ peers: 2, docs: 0, registry: false }).label).toBe("Verified+");
    expect(getVerificationStatus({ peers: 1, docs: 1, registry: false }).label).toBe("Verified+");
  });

  it("previews the next badge after each action", () => {
    const current = { peers: 0, docs: 0, registry: false };
    expect(previewVerificationStatus(current, { peers: 1 }).label).toBe("Verified");
    expect(previewVerificationStatus(current, { docs: 1 }).label).toBe("Verified");
    expect(previewVerificationStatus({ peers: 1, docs: 0, registry: false }, { docs: 1 }).label).toBe(
      "Verified+"
    );
  });
});
