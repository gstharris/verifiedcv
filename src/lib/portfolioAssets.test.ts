import { describe, expect, it } from "vitest";
import { assetForm, assessPortfolioAssetLink, candidateSummary, decodeStoredHighlights, dossierSectionOrder, encodeStoredHighlights, isAllowedPortfolioUpload, normalizeHighlights, normalizePortfolioAsset, parseDossierLayout, publicRegistryLabel, recruiterLayout, workPreviewUrl } from "./portfolioAssets";

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

  it("reserves issuer-linked for credential and patent records", () => {
    expect(publicRegistryLabel("credly")).toBe("Issuer-linked");
    expect(publicRegistryLabel("uspto")).toBe("Issuer-linked");
    expect(publicRegistryLabel("github")).toBe("Public link");
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

  it("uses the image itself and a page thumbnail for other public links", () => {
    expect(workPreviewUrl("https://cdn.example.com/shot.PNG")).toBe("https://cdn.example.com/shot.PNG");
    expect(workPreviewUrl("https://files.example.com/deck.pdf")).toBe("");
    expect(workPreviewUrl("https://pairedright.com")).toContain("mshots");
  });

  it("accepts decks and images and rejects other files", () => {
    expect(isAllowedPortfolioUpload("Talk.pptx")).toBe(true);
    expect(isAllowedPortfolioUpload("shot.PNG")).toBe(true);
    expect(isAllowedPortfolioUpload("notes.docx")).toBe(false);
  });
});

describe("recruiter layouts", () => {
  it("keeps older layout ids and separates the resume template from sample work", () => {
    expect(parseDossierLayout("traditional")).toMatchObject({ template: "summary", placement: "bottom" });
    expect(parseDossierLayout("hybrid").placement).toBe("top");
    expect(parseDossierLayout("creative").placement).toBe("top");
    expect(recruiterLayout("summary:top").blocks[0]).toBe("work");
    expect(dossierSectionOrder("experience:bottom")).toEqual(["highlights", "experience", "skills", "education", "work"]);
    expect(dossierSectionOrder("summary-highlights:top").slice(0, 3)).toEqual(["work", "summary", "highlights"]);
    expect(dossierSectionOrder("summary:hidden")).not.toContain("work");
    expect(parseDossierLayout("highlights:off")).toMatchObject({ template: "experience", placement: "hidden" });
    expect(dossierSectionOrder("highlights:bottom")).not.toContain("summary");
  });

  it("keeps highlight lines the candidate wrote, separate from chapter bullets", () => {
    expect(
      normalizeHighlights([
        "Built the pairing product and later scaled it at Yahoo.",
        "too short",
        "Built the pairing product and later scaled it at Yahoo."
      ])
    ).toEqual(["Built the pairing product and later scaled it at Yahoo."]);
    const stored = encodeStoredHighlights(["Led Ge-on from founding through the first enterprise contracts."]);
    expect(decodeStoredHighlights(stored)).toEqual(["Led Ge-on from founding through the first enterprise contracts."]);
    expect(candidateSummary("", stored)).toBe("");
    expect(candidateSummary("Operator and product lead.", stored)).toBe("Operator and product lead.");
  });
});
