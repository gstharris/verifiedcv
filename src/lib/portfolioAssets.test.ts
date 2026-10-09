import { describe, expect, it } from "vitest";
import { assetForm, assessPortfolioAssetLink, isAllowedPortfolioUpload, normalizePortfolioAsset, recruiterLayout, RECRUITER_LAYOUTS } from "./portfolioAssets";

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

describe("work sample forms", () => {
  it("asks a certification for issuer, year, and a credential link", () => {
    const form = assetForm("certification");
    expect(form.issuer).toBeTruthy();
    expect(form.issuedAt).toBeTruthy();
    expect(form.url).toBeTruthy();
    expect(form.file).toBeUndefined();
    expect(form.description).toBeUndefined();
  });

  it("asks a project for a link or a file, not an issuer", () => {
    const form = assetForm("project");
    expect(form.file).toBeTruthy();
    expect(form.url).toBeTruthy();
    expect(form.issuer).toBeUndefined();
  });

  it("accepts decks and images and rejects other files", () => {
    expect(isAllowedPortfolioUpload("Talk.pptx")).toBe(true);
    expect(isAllowedPortfolioUpload("shot.PNG")).toBe(true);
    expect(isAllowedPortfolioUpload("notes.docx")).toBe(false);
  });
});

describe("recruiter layouts", () => {
  it("puts sample work at the bottom by default and at the top for the other choices", () => {
    expect(recruiterLayout("traditional").title).toBe("Bottom");
    expect(recruiterLayout("traditional").blocks.at(-1)).toBe("work");
    expect(recruiterLayout("traditional").blocks[0]).toBe("experience");
    expect(recruiterLayout("hybrid").title).toBe("Top");
    expect(recruiterLayout("hybrid").blocks[0]).toBe("work");
    expect(recruiterLayout("creative").title).toBe("Top grid");
    expect(recruiterLayout("creative").featured).toBe(true);
    expect(recruiterLayout("missing").id).toBe("traditional");
  });

  it("only places work samples first or last, matching the public page", () => {
    for (const layout of RECRUITER_LAYOUTS) {
      const index = layout.blocks.indexOf("work");
      expect(index === 0 || index === layout.blocks.length - 1).toBe(true);
    }
  });
});
