import { describe, expect, it } from "vitest";
import { assessPortfolioAssetLink, normalizePortfolioAsset } from "./portfolioAssets";

describe("portfolio asset link checks", () => {
  it("marks Credly certification URLs as registry links", () => {
    const result = assessPortfolioAssetLink("https://www.credly.com/badges/abc", "certification");
    expect(result.verificationStatus).toBe("registry");
  });

  it("marks USPTO and Google Patents URLs as registry links", () => {
    expect(assessPortfolioAssetLink("https://patents.google.com/patent/US1234567", "patent").verificationStatus).toBe(
      "registry"
    );
  });

  it("treats a generic project URL as a saved public link", () => {
    const result = assessPortfolioAssetLink("https://example.com/demo", "prototype");
    expect(result.verificationStatus).toBe("link_checked");
  });

  it("drops untitled assets", () => {
    expect(normalizePortfolioAsset({ url: "https://example.com" })).toBeNull();
  });
});
