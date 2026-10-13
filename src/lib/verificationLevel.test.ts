import { describe, expect, it } from "vitest";
import { getVerificationStatus, previewVerificationStatus, publicChapterLabel } from "./verificationLevel";

describe("company verification levels", () => {
  it("leaves a chapter with no proof unlabeled in public", () => {
    expect(getVerificationStatus({ peers: 0, docs: 0, registry: false })).toEqual({
      level: 0,
      label: "On your profile"
    });
    expect(publicChapterLabel(0)).toBeNull();
  });

  it("calls one independent source Corroborated", () => {
    expect(getVerificationStatus({ peers: 1, docs: 0, registry: false }).label).toBe("Corroborated");
    expect(getVerificationStatus({ peers: 0, docs: 1, registry: false }).label).toBe("Corroborated");
    expect(publicChapterLabel(1)).toBe("Corroborated");
  });

  it("calls two independent sources Multi-source", () => {
    expect(getVerificationStatus({ peers: 2, docs: 0, registry: false }).label).toBe("Multi-source");
    expect(getVerificationStatus({ peers: 1, docs: 1, registry: false }).label).toBe("Multi-source");
    expect(getVerificationStatus({ peers: 3, docs: 0, registry: false }).label).toBe("Multi-source");
    expect(publicChapterLabel(2)).toBe("Multi-source");
    expect(publicChapterLabel(3)).toBe("Multi-source");
  });

  it("does not let a registry flag raise the public label", () => {
    expect(getVerificationStatus({ peers: 0, docs: 0, registry: true }).label).toBe("On your profile");
  });

  it("previews the next label after each action", () => {
    const current = { peers: 0, docs: 0, registry: false };
    expect(previewVerificationStatus(current, { peers: 1 }).label).toBe("Corroborated");
    expect(previewVerificationStatus(current, { docs: 1 }).label).toBe("Corroborated");
    expect(previewVerificationStatus({ peers: 1, docs: 0, registry: false }, { docs: 1 }).label).toBe(
      "Multi-source"
    );
  });
});
